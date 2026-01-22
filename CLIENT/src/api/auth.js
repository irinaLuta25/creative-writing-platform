import http from "./http";

export const apiRegister = (payload) => http.post("/user/register", payload);
export const apiLogin = (payload) => http.post("/user/login", payload);
