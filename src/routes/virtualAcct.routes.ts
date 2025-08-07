import express from "express"

import { createMyAcct, createMyVirtualAcct } from "../controllers/virtualAcct.controller"
const router = express.Router()



router.post("/createMyVirtualAcct", createMyAcct)
router.post("/createMyVirtualAcct2", createMyVirtualAcct)

export default router