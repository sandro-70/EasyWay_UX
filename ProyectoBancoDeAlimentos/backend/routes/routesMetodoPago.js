// routes/routesMetodoPago.js
const router = require("express").Router();
const ctrl = require("../controllers/metodoPagoController");
const verificarToken = require("../middleware/verificarToken"); // el mismo que usaste en /me

// Aplica auth a TODO este router
router.use(verificarToken);

router.get("/", ctrl.getAllMetodosDePago);
router.post("/", ctrl.createNuevoMetodoPago);
router.delete("/:id", ctrl.deleteMetodoPago);
router.patch("/default/:id", ctrl.establecerComoDefault);

// GET /api/metodo-pago/user/:id -> permite a administradores obtener metodos de pago de un user específico
router.get("/user/:id", ctrl.getMetodosDePagoByUserId);

module.exports = router;
