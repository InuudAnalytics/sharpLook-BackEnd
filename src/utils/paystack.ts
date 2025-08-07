import axios from "axios";
import { v4 as uuidv4 } from "uuid";


const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY!;

export const initializePayment = async (email: string, amount: number) => {
     
 
  console.log(typeof amount);
  
  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100,
        callback_url: "sharplookapp://BookAppointmentScreen/:id", 
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.data; // contains `authorization_url`, `access_code`, etc.
  } catch (error: any) {
    console.error("Payment initialization failed:", error.response?.data || error.message);
    throw new Error("Failed to initialize payment");
  }
};

export const verifyPayment = async (reference: string) => {
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      }
    );

    console.log("data got here oo");

    console.log("THis is response=> ",response.data
    );
    
    
    return response.data.data;


  } catch (error: any) {
    console.error("Payment verification failed:", error.response?.data || error.message);
    throw new Error("Failed to verify payment");
  }
};



export const generateReference = () => `REF-${uuidv4()}`;

const PAYSTACK_BASE = "https://api.paystack.co";

/**
 * ✅ Get List of Banks (for user selection)
 */
export const getBanks = async () => {
  const response = await axios.get(`${PAYSTACK_BASE}/bank?country=nigeria`, {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
    },
  });

  return response.data.data; // Array of { name, code, slug }
};


export const createTransferRecipient = async (
  name: string,
  accountNumber: string,
  bankCode: string,
) => {
  const response = await axios.post(
    `${PAYSTACK_BASE}/transferrecipient`,
    
    {
      type: "nuban",
      name: name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: "NGN",
    },
    {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
      },
    }
  );

  return response.data.data.recipient_code;
};

/**
 * ✅ Trigger Auto Withdrawal (Transfer)
 */
export const sendTransfer = async (
  amount: number,
  recipientCode: string,
  reason: string,
  metadata: any = {},
  retries = 2
) => {
  const payload = {
    source: "balance",
    amount: amount * 100,
    recipient: recipientCode,
    reason,
    metadata,
  };

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await axios.post(
        `${PAYSTACK_BASE}/transfer`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET}`,
            "Content-Type": "application/json",
          },
          timeout: 10000, // 10s timeout
        }
      );

      return response.data.data;
    } catch (err: any) {
      if (i === retries || !isRetryablePaystackError(err)) {
        throw err;
      }

      console.warn(`⚠️ Retry transfer attempt ${i + 1}...`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
};

const isRetryablePaystackError = (err: any) => {
  const code = err?.response?.status;
  return code === 502 || code === 503 || code === 504 || err.code === 'ECONNABORTED';
};



const paystack = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET}`,
    'Content-Type': 'application/json'
  }
});

// Create Customer on Paystack
export const createCustomer= async (email: string, firstName: string, lastName: string, phone: any)=> {
  const response = await paystack.post('/customer', {
    email,
    first_name: firstName,
    last_name: lastName,
    phone
  });
  return response.data.data;  // returns customer object
}

// Create Dedicated Virtual Account for a Customer
export const createVirtual = async  (customerCode: any, preferredBank = 'wema-bank', email : string) => {
  const response = await paystack.post('/dedicated_account', {
    customer: customerCode,
    preferred_bank: preferredBank,
    email,
  });
  return response.data.data;  // returns dedicated account object
}

