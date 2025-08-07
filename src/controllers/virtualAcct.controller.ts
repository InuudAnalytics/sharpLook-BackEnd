import { Request, Response } from "express"
import  {createCustomer, createVirtual}  from "../utils/paystack"
import { success } from "zod"


export const createMyAcct = async (req: Request, res: Response) => {
    const {email, firstName, lastName, phone} = req.body

    try {
        const response = await createCustomer(email, firstName, lastName, phone)

        console.log(response);

        if (response){
        res.status(200).json({
            success : true,
            message : response
        })
    }
    } catch (error) {
          console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    
    }
}

export const createMyVirtualAcct = async (req: Request, res: Response) => {

    const {customerCode, preferredBank, email} = req.body



    
        
        try {
            
    const response = await createVirtual(customerCode, preferredBank, email )

    console.log(response);
            res.status(200).json({
                success: true,
                message:response
            })
          
        } catch (error){
          console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    
    }
}