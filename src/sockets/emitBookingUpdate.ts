// // src/utils/emitBookingUpdate.ts

// import { getSocketIO } from "./socket.handlers";
// import { generateRoomId } from "./generateRoomId";

// export function emitBookingUpdate({
//   clientId,
//   vendorId,
//   type,
//   booking,
// }: {
//   clientId: string;
//   vendorId: string;
//   type: "CREATED" | "ACCEPTED" | "PAID" | "COMPLETED" | "UPDATED";
//   booking: any;
// }) {
//   const io = getSocketIO();
//   const roomId = generateRoomId(clientId, vendorId);

//   io.to(roomId).emit("bookingUpdate", {
//     type,
//     booking,
//   });
// }
