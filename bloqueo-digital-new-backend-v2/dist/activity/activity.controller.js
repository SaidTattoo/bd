"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityController = void 0;
const mongoose_1 = require("mongoose");
const activity_model_1 = require("./activity.model");
const mongoose_2 = require("mongoose");
const users_model_1 = __importDefault(require("../users/users.model"));
const equipment_model_1 = require("../Equipment/equipment.model");
exports.activityController = {
    /**
     * Obtiene todas las actividades con sus relaciones
     * - Popula las relaciones de dueños de energía y equipos
     * - Retorna un error 404 si no hay actividades
     * - Usa lean() para mejor rendimiento
     */
    getAllActivities(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const activities = yield activity_model_1.ActivityModel.find()
                    .populate('energyOwners.user')
                    .populate('equipments')
                    .lean();
                if (!activities || activities.length === 0) {
                    return res.status(404).json({
                        mensaje: 'No se encontraron actividades'
                    });
                }
                res.json(activities);
            }
            catch (error) {
                console.error('Error al obtener actividades:', error);
                res.status(500).json({
                    error: 'Error interno del servidor al obtener actividades'
                });
            }
        });
    },
    /**
     * Obtiene una actividad específica por su ID
     * - Popula las relaciones de dueños de energía y equipos
     * - Retorna un error 404 si la actividad no existe
     */
    getActivityById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            if (!(0, mongoose_2.isValidObjectId)(id)) {
                return res.status(400).json({ mensaje: 'ID de actividad inválido' });
            }
            const activity = yield activity_model_1.ActivityModel.findById(id)
                .populate('energyOwners.user')
                .populate('energyOwners.supervisors.user')
                .populate('energyOwners.supervisors.workers') // Popula los trabajadores con los datos completos
                .populate('equipments');
            if (!activity) {
                return res.status(404).json({ mensaje: 'Actividad no encontrada' });
            }
            res.json(activity);
        });
    },
    validateZeroEnergy(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { activityId } = req.params;
                const validation = req.body;
                // Buscamos la actividad en la base de datos
                const activity = yield activity_model_1.ActivityModel.findById(activityId);
                if (!activity) {
                    return res.status(404).json({
                        mensaje: 'Actividad no encontrada'
                    });
                }
                // Actualizamos la validación de energía cero
                activity.zeroEnergyValidation = validation;
                // Guardamos los cambios en la base de datos
                yield activity.save();
                // Actualizamos todos los equipos relacionados con la actividad
                yield equipment_model_1.EquipmentModel.updateMany({ _id: { $in: activity.equipments } }, { $set: { zeroEnergyValidated: true } });
                // Recuperamos la actividad actualizada, con los campos relacionados poblados
                const updatedActivity = yield activity_model_1.ActivityModel.findById(activityId)
                    .populate('energyOwners.user')
                    .populate('equipments')
                    .lean();
                res.json({
                    mensaje: 'Validación de energía cero actualizada exitosamente',
                    actividad: updatedActivity
                });
            }
            catch (error) {
                res.status(500).json({
                    error: 'Error al validar energía cero',
                    detalles: error.message
                });
            }
        });
    },
    removeZeroEnergyValidation(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { activityId } = req.params;
            // Eliminar solo el campo zeroEnergyValidation de la actividad
            const activity = yield activity_model_1.ActivityModel.findByIdAndUpdate(activityId, { $unset: { zeroEnergyValidation: "" } }, // Cambiar a "" para eliminar el campo
            { new: true } // Asegura que se devuelva el documento actualizado
            );
            if (!activity) {
                return res.status(404).json({ mensaje: 'Actividad no encontrada' });
            }
            res.json({
                mensaje: 'Validación de energía cero eliminada exitosamente',
                actividad: activity
            });
        });
    },
    /**
     * Crea una nueva actividad
     * - Asigna la fecha de creación automáticamente
     * - Valida los datos requeridos
     * - Retorna la actividad creada
     */
    createActivity(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const _a = req.body, { energyOwners, equipments, name } = _a, rest = __rest(_a, ["energyOwners", "equipments", "name"]);
                // Convertir strings a ObjectId
                const energyOwnersWithIds = energyOwners.map((owner) => (Object.assign(Object.assign({}, owner), { user: new mongoose_1.Types.ObjectId(owner.user) })));
                const equipmentIds = equipments.map((equipment) => new mongoose_1.Types.ObjectId(equipment));
                // Verificar que el título esté presente
                if (!name) {
                    return res.status(400).json({ error: 'El título es obligatorio' });
                }
                const newActivity = new activity_model_1.ActivityModel(Object.assign(Object.assign({}, rest), { energyOwners: energyOwnersWithIds, equipments: equipmentIds, name, createdAt: new Date() }));
                yield newActivity.save();
                res.status(201).json(newActivity);
            }
            catch (error) {
                res.status(400).json({
                    error: 'Error al crear la actividad',
                    detalles: error.message
                });
            }
        });
    },
    /**
     * Actualiza una actividad existente
     * - Valida que la actividad exista
     * - Actualiza solo los campos proporcionados
     * - Retorna la actividad actualizada
     */
    updateActivity(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const activity = yield activity_model_1.ActivityModel.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true }).populate('equipments');
                if (!activity) {
                    return res.status(404).json({
                        mensaje: 'Actividad no encontrada'
                    });
                }
                res.json(activity);
            }
            catch (error) {
                res.status(400).json({
                    error: 'Error al actualizar la actividad',
                    detalles: error.message
                });
            }
        });
    },
    /**nose pueden repetir los equipos en una actividad */
    addEquipmentToActivity(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { activityId } = req.params;
            const { _id } = req.body;
            console.log(activityId, _id);
            const activity = yield activity_model_1.ActivityModel.findById(activityId);
            console.log(activity);
            if (!activity) {
                return res.status(404).json({ error: 'Actividad no encontrada' });
            }
            if (activity.equipments.includes(_id)) {
                return res.status(400).json({ error: 'El equipo ya existe en la actividad' });
            }
            activity.equipments.push(_id);
            try {
                // Guardar la actividad actualizada
                yield activity.save();
                // Actualizar el estado de zeroEnergyValidated a false para el equipo agregado
                yield equipment_model_1.EquipmentModel.findByIdAndUpdate(_id, { $set: { zeroEnergyValidated: false } });
                res.status(200).json({ message: 'Equipo agregado exitosamente' });
            }
            catch (error) {
                res.status(500).json({ error: 'Error al agregar el equipo a la actividad', detalles: error.message });
            }
        });
    },
    removeEquipmentFromActivity(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { activityId, equipmentId } = req.params;
            const activity = yield activity_model_1.ActivityModel.findById(activityId);
            if (!activity) {
                return res.status(404).json({ error: 'Actividad no encontrada' });
            }
            // Remover el equipo de la lista de equipos de la actividad
            activity.equipments = activity.equipments.filter((id) => id.toString() !== equipmentId);
            try {
                // Guardar la actividad actualizada
                yield activity.save();
                // Actualizar el estado de zeroEnergyValidated a false para el equipo removido
                yield equipment_model_1.EquipmentModel.findByIdAndUpdate(equipmentId, { $set: { zeroEnergyValidated: false } });
                res.status(200).json({ message: 'Equipo eliminado exitosamente' });
            }
            catch (error) {
                res.status(500).json({ error: 'Error al eliminar el equipo de la actividad', detalles: error.message });
            }
        });
    },
    addEnergyOwnerToActivity(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { activityId } = req.params;
                const { userId } = req.body;
                console.log(req.body);
                // Buscar la actividad en la base de datos
                const activity = yield activity_model_1.ActivityModel.findById(activityId);
                if (!activity) {
                    return res.status(404).json({ mensaje: 'Actividad no encontrada' });
                }
                // Buscar el usuario en la base de datos
                const user = yield users_model_1.default.findById(userId);
                if (!user) {
                    return res.status(404).json({ mensaje: 'Usuario no encontrado' });
                }
                // Verificar que el usuario tenga el perfil adecuado
                if (user.perfil !== 'duenoDeEnergia') {
                    return res.status(400).json({ mensaje: 'El usuario debe tener perfil de Dueño de Energía' });
                }
                // Crear el nuevo dueño de energía y agregarlo a la actividad
                const newEnergyOwner = {
                    user: new mongoose_1.Types.ObjectId(userId),
                    isBlocked: false,
                    supervisors: []
                };
                activity.energyOwners.push(newEnergyOwner);
                activity.isBlocked = true;
                yield activity.save();
                // Devolver la actividad actualizada con los datos populados
                const updatedActivity = yield activity_model_1.ActivityModel.findById(activityId)
                    .populate('energyOwners.user')
                    .populate('equipments');
                res.json({ mensaje: 'Dueño de energía agregado exitosamente', actividad: updatedActivity });
            }
            catch (error) {
                res.status(500).json({ error: 'Error al agregar dueño de energía', detalles: error.message });
            }
        });
    },
    assignSupervisor(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { activityId } = req.params;
                const { energyOwnerId, supervisorId } = req.body;
                console.log(req.body);
                // Buscar la actividad
                const activity = yield activity_model_1.ActivityModel.findById(activityId);
                if (!activity) {
                    return res.status(200).json({ mensaje: 'Actividad no encontrada', error: true });
                }
                // Buscar el dueño de energía dentro de la actividad
                const energyOwner = activity.energyOwners.find(owner => owner.user.toString() === energyOwnerId);
                console.log(energyOwner);
                if (!energyOwner) {
                    return res.status(200).json({ mensaje: 'Dueño de energía no encontrado en la actividad', error: true });
                }
                // Verificar que el usuario a agregar como supervisor exista y sea válido
                const user = yield users_model_1.default.findById(supervisorId);
                if (!user || user.perfil !== 'supervisor') {
                    return res.status(200).json({ mensaje: 'Usuario no es válido o no es un supervisor', error: true });
                }
                // Agregar el supervisor al dueño de energía
                const newSupervisor = {
                    user: user,
                    isBlocked: false,
                    workers: []
                };
                energyOwner.supervisors.push(newSupervisor);
                yield activity.save();
                // Recargar la actividad con los datos completos de usuario
                const updatedActivity = yield activity_model_1.ActivityModel.findById(activityId)
                    .populate('energyOwners.user')
                    .populate('energyOwners.supervisors.user') // Popula los supervisores con los datos completos
                    .populate('equipments');
                res.status(200).json({ mensaje: 'Supervisor asignado exitosamente', actividad: updatedActivity, error: false });
            }
            catch (error) {
                res.status(200).json({ mensaje: 'Error al asignar supervisor', detalles: error.message, error: true });
            }
        });
    },
    assignWorker(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { activityId } = req.params;
                const { energyOwnerId, supervisorId, workerId } = req.body;
                // Find the activity
                const activity = yield activity_model_1.ActivityModel.findById(activityId);
                if (!activity) {
                    return res.status(404).json({ mensaje: 'Actividad no encontrada' });
                }
                // Find the energy owner within the activity
                const energyOwner = activity.energyOwners.find(owner => owner.user.toString() === energyOwnerId);
                if (!energyOwner) {
                    return res.status(404).json({ mensaje: 'Dueño de energía no encontrado en la actividad' });
                }
                // Find the supervisor within the energy owner
                const supervisor = energyOwner.supervisors.find(sup => sup.user.toString() === supervisorId);
                if (!supervisor) {
                    return res.status(404).json({ mensaje: 'Supervisor no encontrado para el dueño de energía' });
                }
                // Fetch the worker document
                const user = yield users_model_1.default.findById(workerId);
                if (!user) {
                    return res.status(404).json({ mensaje: 'Trabajador no encontrado' });
                }
                // Check if the worker already exists in the supervisor's workers array
                if (supervisor.workers.some(worker => worker._id.toString() === workerId)) {
                    return res.status(400).json({ mensaje: 'El trabajador ya existe en el supervisor' });
                }
                // Add the full user document to the supervisor's workers array
                supervisor.workers.push(user);
                yield activity.save();
                // Reload the activity with populated data for supervisors and workers
                const updatedActivity = yield activity_model_1.ActivityModel.findById(activityId)
                    .populate('energyOwners.user')
                    .populate('energyOwners.supervisors.user')
                    .populate({
                    path: 'energyOwners.supervisors.workers',
                    model: 'Usuario' // Ensure the model reference is correct here
                })
                    .populate('equipments');
                res.json({ mensaje: 'Trabajador asignado exitosamente', actividad: updatedActivity });
            }
            catch (error) {
                res.status(500).json({ error: 'Error al asignar trabajador', detalles: error.message });
            }
        });
    },
    deleteActivity(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            try {
                const result = yield activity_model_1.ActivityModel.findByIdAndDelete(id);
                if (!result) {
                    return res.status(404).json({ message: 'Actividad no encontrada' });
                }
                res.status(200).json({ message: 'Actividad eliminada exitosamente' });
            }
            catch (error) {
                console.error('Error al eliminar la actividad:', error);
                res.status(500).json({ message: 'Error al eliminar la actividad' });
            }
        });
    }
    /**
     * Agrega un nuevo equipo a una actividad
     * - Verifica que la actividad exista
     * - Crea un nuevo ID para el equipo
     * - Actualiza la lista de equipos de la actividad
     * - Retorna la actividad actualizada con los equipos populados
     */
    /* async addEquipment(req: Request, res: Response) {
      try {
        const activity = await ActivityModel.findById(req.params.id);
        
        if (!activity) {
          return res.status(404).json({
            mensaje: 'Actividad no encontrada'
          });
        }
  
        const equipmentId = new Types.ObjectId();
        activity.equipments = (activity.equipments as Types.ObjectId[]).concat(equipmentId);
        
        await activity.save();
  
        const updatedActivity = await ActivityModel.findById(req.params.id)
          .populate('equipments');
  
        res.status(201).json({
          mensaje: 'Equipo agregado exitosamente',
          actividad: updatedActivity
        });
      } catch (error) {
        res.status(500).json({
          error: 'Error al agregar el equipo a la actividad',
          detalles: (error as Error).message
        });
      }
    }, */
    /**
     * Elimina un equipo de una actividad
     * - Valida los IDs proporcionados
     * - Verifica que la actividad exista
     * - Elimina el equipo de la lista
     * - Retorna la actividad actualizada
     */
    /*  async removeEquipment(req: Request, res: Response) {
       try {
         const { activityId, equipmentId } = req.params;
   
         if (!Types.ObjectId.isValid(activityId) || !Types.ObjectId.isValid(equipmentId)) {
           return res.status(400).json({
             mensaje: 'ID de actividad o equipo inválido'
           });
         }
   
         const activity = await ActivityModel.findById(activityId);
   
         if (!activity) {
           return res.status(404).json({
             mensaje: 'Actividad no encontrada'
           });
         }
   
         activity.equipments = (activity.equipments as Types.ObjectId[]).filter(
           equipo => equipo.toString() !== equipmentId
         );
         
         await activity.save();
   
         const updatedActivity = await ActivityModel.findById(activityId)
           .populate('equipments');
   
         res.json({
           mensaje: 'Equipo eliminado exitosamente',
           actividad: updatedActivity
         });
       } catch (error) {
         res.status(500).json({
           error: 'Error al eliminar el equipo de la actividad',
           detalles: (error as Error).message
         });
       }
     }, */
    /**
     * Actualiza un equipo específico en una actividad
     * - Verifica que la actividad exista
     * - Busca el equipo en la lista
     * - Actualiza los datos del equipo
     * - Retorna la actividad actualizada
     */
    /*   async updateEquipment(req: Request, res: Response) {
        try {
          const { activityId, equipmentId } = req.params;
          const updatedEquipment = req.body;
    
          const activity = await ActivityModel.findById(activityId);
    
          if (!activity) {
            return res.status(404).json({
              mensaje: 'Actividad no encontrada'
            });
          }
    
          const equipmentIndex = (activity.equipments as Types.ObjectId[])
            .findIndex(equipo => equipo.toString() === equipmentId);
    
          if (equipmentIndex === -1) {
            return res.status(404).json({
              mensaje: 'Equipo no encontrado en la actividad'
            });
          }
    
          activity.equipments[equipmentIndex] = new Types.ObjectId(equipmentId);
          await activity.save();
    
          const updatedActivity = await ActivityModel.findById(activityId)
            .populate('equipments');
    
          res.json({
            mensaje: 'Equipo actualizado exitosamente',
            actividad: updatedActivity
          });
        } catch (error) {
          res.status(500).json({
            error: 'Error al actualizar el equipo de la actividad',
            detalles: (error as Error).message
          });
        }
      }, */
    /*  async checkAndUpdateBlockStatus(activity: IActivity): Promise<void> {
        const hasEnergyOwner = activity.energyOwners.length > 0;
        const hasZeroEnergy = activity.zeroEnergyValidation &&
                             activity.zeroEnergyValidation.energyValue === "0";
    
        activity.isBlocked = hasEnergyOwner && hasZeroEnergy;
        await activity.save();
      }, */
    /*  async addEnergyOwnerToActivity(req: Request, res: Response) {
       try {
         const { activityId } = req.params;
         const { userId } = req.body;
   
         const activity = await ActivityModel.findById(activityId);
         if (!activity) {
           return res.status(404).json({
             mensaje: 'Actividad no encontrada'
           });
         }
   
         const user = await Usuario.findById(userId);
         if (!user) {
           return res.status(404).json({
             mensaje: 'Usuario no encontrado'
           });
         }
   
         if (user.perfil !== 'duenoDeEnergia') {
           return res.status(400).json({
             mensaje: 'El usuario debe tener perfil de Dueño de Energía'
           });
         }
   
         const newEnergyOwner: IEnergyOwner = {
           user: new Types.ObjectId(userId),
           isBlocked: false,
           supervisors: []
         };
   
         activity.energyOwners.push(newEnergyOwner);
         await this.checkAndUpdateBlockStatus(activity);
   
         const updatedActivity = await ActivityModel.findById(activityId)
           .populate('energyOwners.user')
           .populate('equipments');
   
         res.json({
           mensaje: 'Dueño de energía agregado exitosamente',
           actividad: updatedActivity
         });
       } catch (error) {
         res.status(500).json({
           error: 'Error al agregar dueño de energía',
           detalles: (error as Error).message
         });
       }
     }, */
    /*
      */
    ,
    /**
     * Agrega un nuevo equipo a una actividad
     * - Verifica que la actividad exista
     * - Crea un nuevo ID para el equipo
     * - Actualiza la lista de equipos de la actividad
     * - Retorna la actividad actualizada con los equipos populados
     */
    /* async addEquipment(req: Request, res: Response) {
      try {
        const activity = await ActivityModel.findById(req.params.id);
        
        if (!activity) {
          return res.status(404).json({
            mensaje: 'Actividad no encontrada'
          });
        }
  
        const equipmentId = new Types.ObjectId();
        activity.equipments = (activity.equipments as Types.ObjectId[]).concat(equipmentId);
        
        await activity.save();
  
        const updatedActivity = await ActivityModel.findById(req.params.id)
          .populate('equipments');
  
        res.status(201).json({
          mensaje: 'Equipo agregado exitosamente',
          actividad: updatedActivity
        });
      } catch (error) {
        res.status(500).json({
          error: 'Error al agregar el equipo a la actividad',
          detalles: (error as Error).message
        });
      }
    }, */
    /**
     * Elimina un equipo de una actividad
     * - Valida los IDs proporcionados
     * - Verifica que la actividad exista
     * - Elimina el equipo de la lista
     * - Retorna la actividad actualizada
     */
    /*  async removeEquipment(req: Request, res: Response) {
       try {
         const { activityId, equipmentId } = req.params;
   
         if (!Types.ObjectId.isValid(activityId) || !Types.ObjectId.isValid(equipmentId)) {
           return res.status(400).json({
             mensaje: 'ID de actividad o equipo inválido'
           });
         }
   
         const activity = await ActivityModel.findById(activityId);
   
         if (!activity) {
           return res.status(404).json({
             mensaje: 'Actividad no encontrada'
           });
         }
   
         activity.equipments = (activity.equipments as Types.ObjectId[]).filter(
           equipo => equipo.toString() !== equipmentId
         );
         
         await activity.save();
   
         const updatedActivity = await ActivityModel.findById(activityId)
           .populate('equipments');
   
         res.json({
           mensaje: 'Equipo eliminado exitosamente',
           actividad: updatedActivity
         });
       } catch (error) {
         res.status(500).json({
           error: 'Error al eliminar el equipo de la actividad',
           detalles: (error as Error).message
         });
       }
     }, */
    /**
     * Actualiza un equipo específico en una actividad
     * - Verifica que la actividad exista
     * - Busca el equipo en la lista
     * - Actualiza los datos del equipo
     * - Retorna la actividad actualizada
     */
    /*   async updateEquipment(req: Request, res: Response) {
        try {
          const { activityId, equipmentId } = req.params;
          const updatedEquipment = req.body;
    
          const activity = await ActivityModel.findById(activityId);
    
          if (!activity) {
            return res.status(404).json({
              mensaje: 'Actividad no encontrada'
            });
          }
    
          const equipmentIndex = (activity.equipments as Types.ObjectId[])
            .findIndex(equipo => equipo.toString() === equipmentId);
    
          if (equipmentIndex === -1) {
            return res.status(404).json({
              mensaje: 'Equipo no encontrado en la actividad'
            });
          }
    
          activity.equipments[equipmentIndex] = new Types.ObjectId(equipmentId);
          await activity.save();
    
          const updatedActivity = await ActivityModel.findById(activityId)
            .populate('equipments');
    
          res.json({
            mensaje: 'Equipo actualizado exitosamente',
            actividad: updatedActivity
          });
        } catch (error) {
          res.status(500).json({
            error: 'Error al actualizar el equipo de la actividad',
            detalles: (error as Error).message
          });
        }
      }, */
    /*  async checkAndUpdateBlockStatus(activity: IActivity): Promise<void> {
        const hasEnergyOwner = activity.energyOwners.length > 0;
        const hasZeroEnergy = activity.zeroEnergyValidation &&
                             activity.zeroEnergyValidation.energyValue === "0";
    
        activity.isBlocked = hasEnergyOwner && hasZeroEnergy;
        await activity.save();
      }, */
    /*  async addEnergyOwnerToActivity(req: Request, res: Response) {
       try {
         const { activityId } = req.params;
         const { userId } = req.body;
   
         const activity = await ActivityModel.findById(activityId);
         if (!activity) {
           return res.status(404).json({
             mensaje: 'Actividad no encontrada'
           });
         }
   
         const user = await Usuario.findById(userId);
         if (!user) {
           return res.status(404).json({
             mensaje: 'Usuario no encontrado'
           });
         }
   
         if (user.perfil !== 'duenoDeEnergia') {
           return res.status(400).json({
             mensaje: 'El usuario debe tener perfil de Dueño de Energía'
           });
         }
   
         const newEnergyOwner: IEnergyOwner = {
           user: new Types.ObjectId(userId),
           isBlocked: false,
           supervisors: []
         };
   
         activity.energyOwners.push(newEnergyOwner);
         await this.checkAndUpdateBlockStatus(activity);
   
         const updatedActivity = await ActivityModel.findById(activityId)
           .populate('energyOwners.user')
           .populate('equipments');
   
         res.json({
           mensaje: 'Dueño de energía agregado exitosamente',
           actividad: updatedActivity
         });
       } catch (error) {
         res.status(500).json({
           error: 'Error al agregar dueño de energía',
           detalles: (error as Error).message
         });
       }
     }, */
    /*
      */
    pendingNewEnergyOwner(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { activityId } = req.params;
            const activity = yield activity_model_1.ActivityModel.findById(activityId);
            if (!activity) {
                return res.status(404).json({
                    mensaje: 'Actividad no encontrada'
                });
            }
            //update status pendingNewEnergyOwner to true
            activity.pendingNewEnergyOwner = true;
            yield activity.save();
            res.json(activity);
        });
    }
};
