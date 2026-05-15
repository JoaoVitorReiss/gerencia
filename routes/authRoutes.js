const { Router }  = require('express');
const authController = require("../controller/authController.js");

const router = Router();

// router.get("/login_get", authController.login_get);

router.post("/login", authController.login_post);

// router.get("/dashboard_adm", authController.dashboard_adm)

module.exports = router;