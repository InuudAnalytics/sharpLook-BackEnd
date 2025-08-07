import axios from "axios";

export const sendSmS = async (
  to: string,
  otpCOde: number
  
 
) => {
  const sms = `Your Sharplook NG verification pin is : ${otpCOde}, pls do not share it give this code to anyone.`
  try {
    const response = await axios.post("https://v3.api.termii.com/api/sms/send", {
      to,
      from: "N-Alert",
      sms,
      type: "plain", // Assuming plain is the required type
      channel: "dnd",
      api_key:  process.env.TERMII_API_KEY
    });

    return response.data;
  } catch (error:any) {
    console.error("Error sending SMS:", error.data.message);
    // throw error;
  }
};


