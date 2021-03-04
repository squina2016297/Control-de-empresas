'use strict'

var User = require('../models/user.model')
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');
var pdf = require('html-pdf');
var Empleado = require('../models/empleado.model');

function prueba(req, res){
    res.status(200).send({message: 'Funcionando correctamente'})
}

function createInit(req, res){
    let user = new User();
    User.findOne({username: 'admin'}, (err, userFind)=>{
        if(err){
            console.log('Error al cargar el administrador');
        }else if(userFind){
            console.log('El administrador ya fué creado')
        }else{
            user.password = "12345";
            bcrypt.hash(user.password, null, null, (err, passwordHash)=>{
                if(err){
                    res.status(500).send({message: 'Error al encriptar la contraseña'})
                }else if(passwordHash){
                    user.username = "admin";
                    user.password = passwordHash;
                    user.role = "ROLE_ADMIN"
                    user.save((err, userSave)=>{
                        if(err){
                            console.log('Error al crear al administrador')
                        }else if(userSave){
                            console.log('El administrador fué creado')
                        }else{
                            console.log('El administrador no fué creado')
                        }
                    })
                }
            })
        }
    })
}

function login(req, res){
    var params = req.body;

    if(params.username && params.password){
        User.findOne({username: params.username.toLowerCase()}, (err, userFind)=>{
            if(err){
                return res.status(500).send({message: 'Error general'});
            }else if(userFind){
                bcrypt.compare(params.password, userFind.password, (err, checkPassword)=>{
                    if(err){
                        return res.status(500).send({message: 'Error general en la verificación de la contraseña'});
                    }else if(checkPassword){
                        if(params.gettoken){
                            return res.send({ token: jwt.createToken(userFind)});
                        }else{
                            return res.send({message: 'Usuario logeado'})
                        }
                    }else{
                        return res.status(404).send({message: 'Contraseña incorrecta'});
                    }
                })
            }else{
                return res.send({message: 'usuario no encontrado'})
            }
        })
    }else{
        return res.status(401).send({message: 'Porfavor ingresa todos los datos'});
    }
}

function saveUser(req, res){
    var user = new User();
    var params = req.body;

    if(params.name && params.username && params.password && params.address && params.phone){
        User.findOne({username: params.username}, (err, userFind)=>{
            if(err){
                return res.send({message: 'Error general en el servidor'})
            }else if(userFind){
                return res.send({message: 'Nombre de usuario ya en uso'})
            }else{
                bcrypt.hash(params.password, null, null, (err, passwordHash)=>{
                    if(err){
                        return res.status(500).send({message: 'Error general en la encriptación'});
                    }else if(passwordHash){
                        user.password = passwordHash;
                        user.name = params.name.toLowerCase();
                        user.username = params.username.toLowerCase();
                        user.phone = params.phone;
                        user.address = params.address.toLowerCase();
                        user.role = "ROLE_EMPRESA";

                        user.save((err, userSaved)=>{
                            if(err){
                                return res.status(500).send({message: 'Error general al guardar'});
                            }else if(userSaved){
                                return res.send({message: 'Empresa guardada', userSaved})
                            }else{
                                return res.send(500).send({message: 'No se guardó la empresa'})
                            }
                        })
                    }else{
                        return res.status(401).send({message: 'Contraseña no encriptada'})
                    }
                })
            }
        })
    }else{
        return res.send({message: 'Porfavor ingresa todos los datos'});
    }
}

function updateUser(req, res){
    let userId = req.params.id;
    let update = req.body;

    if('ROLE_ADMIN' != req.user.role && userId != req.user.sub){
        return res.status(500).send({message: 'No tienes permiso para realizar esta acción'})
    }else{
        if(update.password){
            return res.status(500).send({message: 'No se puede actualizar la contraseña'});
        }else{
            if(update.username){
                User.findOne({username: update.username.toLowerCase()}, (err, userFind)=>{
                    if(err){
                        return res.status(500).send({message: 'Error general'});
                    }else if(userFind){
                        return res.send({message: 'No se puede actualizar, nombre de usuario ya en uso'});
                    }else{
                        User.findByIdAndUpdate(userId, update, {new: true}, (err, userUpdated)=>{
                            if(err){
                                return res.status(500).send({message: 'Error general al actualizar'});
                            }else if(userUpdated){
                                return res.send({message: 'Usuario actualizado', userUpdated});
                            }else{
                                return res.send({message: 'No se pudo actualizar al usuario'});
                            }
                        })
                    }
                })
            }else{
                User.findByIdAndUpdate(userId, update, {new: true}, (err, userUpdated)=>{
                    if(err){
                        return res.status(500).send({message: 'Error general al actualizar'});
                    }else if(userUpdated){                        
                        return res.send({message: 'Usuario actualizado', userUpdated});
                    }else{
                        return res.send({message: 'No se pudo actualizar al usuario'});
                    }
                })
            }
        }
    }
}

function getUsers(req, res){
    User.find({}).exec((err, users)=>{
        if(err){
            return res.status(500).send({message: 'Error general en el servidor'})
        }else if(users){
            return res.send({message: 'Usuarios:', users})
        }else{
            return res.status(404).send({message: 'No hay registros'})
        }
    })
}

function removeUser(req, res){
    let userId = req.params.id;
    let params = req.body;

    if('ROLE_ADMIN' != req.user.role && userId != req.user.sub){
        return res.status(403).send({message: 'No tienes permiso para eliminar esta empresa'});
    }else{
        User.findOne({_id: userId}, (err, userFind)=>{
            if(err){
                return res.status(500).send({message: 'Error general al eliminar'});
            }else if(userFind){
                bcrypt.compare(params.password, userFind.password, (err, checkPassword)=>{
                    if(err){
                        return res.status(500).send({message: 'Error general al intentar eliminar'})
                    }else if(checkPassword){
                        User.findByIdAndRemove(userId, (err, userRemoved)=>{
                            if(err){
                                return res.status(500).send({message: 'Error general al eliminar'});
                            }else if(userRemoved){
                                return res.send({message: 'Usuario eliminado', userRemoved});
                            }else{
                                return res.status(403).send({message: 'Usuario no eliminado'});
                            }
                        })
                    }else{
                        return res.status(403).send({message: 'Contraseña incorrecta, no puedes eliminar tu cuenta sin tu contraseña'});
                    }
                })
            }else{
                return res.status(403).send({message: 'Usuario no eliminado'});
            } 
        })
    }
}

function pdfEmpresa(req, res){
    let userId = req.params.id;

    if(userId != req.user.sub){
        return res.status(500).send({message: 'No tienes permisos para realizar esta acción'})
    }else{
        User.findOne({_id: userId}).populate().exec((err, userFind)=>{
            if(err){
                res.status(500).send({message: 'Error al mostrar datos'})
            }else if(userFind){
                let empleados = userFind.empleados;
                let empleadosEncontrados = [];
                var empleadosPdf = [];
    
                empleados.forEach(elemento =>{
                    empleadosEncontrados.push(elemento);
                })
    
                empleadosEncontrados.forEach(elemento=>{
                    Empleado.find({_id: elemento}).exec((err, empleadoEncontrado)=>{
                        if(err){
                            console.log(err);
                        }else if(empleadosEncontrados.length > 0){
                            let empleados = empleadoEncontrado;
                            empleados.forEach(elemento =>{
                                empleadosPdf.push(elemento);
                            })
                            let content = `
                                <!doctype html>
                                <html>
                                    <head>
                                        <meta charset = "utf-8">
                                        <title>PDF</title>
                                    </head>
                                    <body>
                                        <div style="text-align:center; margin-top:70px">
                                            <table border = "1" style="margin: 0 auto; border-collapse: collapse;" >
                                                <tbody>
                                                    <tr>
                                                        <th>Primer Nombre</th>
                                                        <th>Primer apellido</th>
                                                        <th>Puesto</th>
                                                        <th>Departamento</th>
                                                    </tr>
                                                    <tr>
                                                        ${empleadosPdf.map(empleado => `
                                                                                        <tr>
                                                                                        <td>${empleado.name}</td>
                                                                                        <td>${empleado.lastname}</td>
                                                                                        <td>${empleado.puesto}</td>
                                                                                        <td>${empleado.departamento}</td>
                                                                                        </tr>                                                                                  
                                                                        `).join(``)}
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </body>
                                </html>
                            `;
                            let options = {
                                paginationOffset :1,
                                "header":{
                                    "height": "45px",
                                    "font-size":"70px;",
                                    "contents" : '<div style="text-align: center;font-size:60px;background-color:#00D4FF;color:white;font-family:Helvetica">' + userFind.name + '</div>'
                                }
                            }
                            pdf.create(content, options).toFile('./PDF/Empleados de '+ userFind.name + '.pdf', 
                            function (err, res){
                                if(err){
                                    console.log(err);
                                }else{
                                    console.log(res);
                                }
                            })
                        }else{
                            res.status(404).send({message: 'No se encontró ningun dato'})
                        }
                    })
                })
                res.status(300).send({message: 'El PDF fué creado'})
            }else{
                res.status(404).send({message: 'No hay ningun empleado'})
            }
        })
    }
}

module.exports = {
    prueba,
    saveUser,
    createInit,
    login,
    updateUser,
    getUsers,
    removeUser,
    pdfEmpresa,
}


//uwu