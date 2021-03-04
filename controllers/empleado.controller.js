'use strict'

var User = require('../models/user.model');
var Empleado = require('../models/empleado.model');

function setEmpleado(req, res){
    var userId = req.params.id;
    var params = req.body;
    var empleado = new Empleado();

    if(userId != req.user.sub){
        return res.status(500).send({message: 'No tienes permiso para realizar esta acción'})
    }else{
        if(params.name && params.lastname && params.puesto && params.departamento){
            User.findById(userId, (err, userFind)=>{
                if(err){
                    return res.statis(500).send({message: 'Error general'})
                }else if(userFind){
                    empleado.name = params.name;
                    empleado.lastname = params.lastname;
                    empleado.puesto = params.puesto;
                    empleado.departamento = params.departamento;
    
                    empleado.save((err, empleadoSaved)=>{
                        if(err){
                            return res.status(500).send({message: 'Error general al guardar'})
                        }else if(empleadoSaved){
                            User.findByIdAndUpdate(userId, {$push: {empleados: empleadoSaved._id}}, {new: true}, (err, empleadoPush)=>{
                                if(err){
                                    return res.status(500).send({message: 'Error general al agregar empleado'})
                                }else if(empleadoPush){                                  
                                    User.findByIdAndUpdate(userId, {$inc: {cant: +1}},{new:true}, (err, empresaInc)=>{
                                        if(err){
                                            res.status(500).send({message: 'Error al incrementar el empleado'})
                                        }else if(empresaInc){
                                            return res.send({message: 'Empleado agregado', empresaInc})
                                        }
                                    })
                                }else{
                                    return res.status(500).send({message: 'Error al agregar Empleado'})
                                }
                            })
                        }else{
                            return res.status(404).send({message: 'No se guardó el contacto'})
                        }
                    })
                }else{
                    return res.status(404).send({message: 'La empresa alque deseas agregar el contacto no existe'})
                }
            })
        }else{
            return res.send({message: 'Por favor ingresa los datos obligatorios'});
        }
    }
}

function updateEmpleado(req, res){
    let userId = req.params.idU;
    let empleadoId = req.params.idE;
    let update = req.body;

    if(userId != req.user.sub){
        return res.status(500).send({message: 'No tienes permiso para realizar esta acción'});
    }else{
        if(update.name){
            Empleado.findById(empleadoId, (err, empleadoFind)=>{
                if(err){
                    return res.status(500).send({message: 'Error general al buscar'});
                }else if(empleadoFind){
                    User.findOne({_id: userId, empleados: empleadoId}, (err, userFind)=>{
                        if(err){
                            return res.status(500).send({message: 'Error general en la búsqueda del usuario'})
                        }else if(userFind){
                            Empleado.findByIdAndUpdate(empleadoId, update, {new: true}, (err, empleadoUpdated)=>{
                                if(err){
                                    return res.status(500).send({message: 'Error general en la actualizacion'})
                                }else if(empleadoUpdated){
                                    return res.send({message: 'Empleado actualizado', empleadoUpdated});
                                }else{
                                    return res.status(404).send({message: 'Empleado no actualizado'})
                                }
                            })
                        }else{
                            return res.status(404).send({message: 'Usuario no encontrado'})
                        }
                    })
                }else{
                    return res.status(404).send({message: 'Empleado a actualizar inexistente'});
                }
            })
        }else{
            return res.status(404).send({message: 'Por favor ingresa los datos mínimos para actualizar'});
        }
    }
}

function removeEmpleado(req, res){
    let userId = req.params.idU;
    let empleadoId = req.params.idE;

    if(userId != req.user.sub){
        return res.status(500).send({message: 'No tienes permisos para realizar esta acción'});
    }else{
        User.findOneAndUpdate({_id: userId, empleados: empleadoId},
            {$pull:{empleados: empleadoId}}, {new: true}, (err, empleadoPull)=>{
                if(err){
                    return res.status(500).send({message: 'Error general'});
                }else if(empleadoPull){
                    Empleado.findByIdAndRemove(empleadoId, (err, empleadoRemoved)=>{
                        if(err){
                            return res.status(500).send({message: 'Error general al eliminar el empleado'})
                        }else if(empleadoRemoved){
                            User.findByIdAndUpdate(userId, {$inc: {cant: -1}},{new:true}, (err, empresaInc)=>{
                                if(err){
                                    res.status(500).send({message: 'Error al desincrementar el empleado'})
                                }else if(empresaInc){
                                    res.status(200).send({message: 'Actualización de empresa', empresaInc})
                                }
                            })
                        }else{
                            return res.status(403).send({message: 'Empleado no encontrado, o ya eliminado'})
                        }
                    })
                }else{
                    return res.status(500).send({message: 'No se pudo eliminar el empleado de la Empresa'});
                }
            }).populate('empleados')
    }
}

function search(req, res){
    var params = req.body;

    if(params.search){
        Empleado.find({$or:[{name: params.search},
                            {lastname: params.search},
                            {puesto: params.search},
                            {departamento: params.search}]}, (err, resultSearch)=>{
                                if(err){
                                    return res.status(500).send({message: 'Error general'});
                                }else if(resultSearch){
                                    return res.send({message: 'Coincidencias encontradas: ', resultSearch});
                                }else{
                                    return res.status(403).send({message: 'Búsqueda sin coincidencias'});
                                }
                            })                    
    }else{
        return res.status(403).sebd({message: 'Ingresa datos en el campo de búsqueda'});
    }
    
}

function getEmpleados(req, res){
    let userId = req.params.id;

    if(userId != req.user.sub){
        return res.status(500).send({message: 'No tienes permiso para realizar esta acción'})
    }else{  
        User.findOne({_id: userId}).populate('empleados').exec((err, empleadosFind)=>{
            if(err){
                return res.status(500).send({message: 'Error general en el servidor'})
            }else if(empleadosFind){
                return res.send({message: 'Empleados: ', empleados: empleadosFind})               
                  
            }else{
                return res.status(404).send({message: 'No hay empleados'})
            }
        })
    }
}

module.exports = {
    setEmpleado,
    updateEmpleado,
    removeEmpleado,
    search,
    getEmpleados
}