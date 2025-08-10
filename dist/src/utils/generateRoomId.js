"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRoomId = void 0;
const generateRoomId = (userA, userB) => {
    return [userA, userB].sort().join("_");
};
exports.generateRoomId = generateRoomId;
