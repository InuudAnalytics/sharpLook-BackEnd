"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const clientService_controller_1 = require("../controllers/clientService.controller");
const router = (0, express_1.Router)();
router.get("/services", clientService_controller_1.fetchAllServices);
router.get("/services/:vendorId", clientService_controller_1.fetchVendorServices);
exports.default = router;
