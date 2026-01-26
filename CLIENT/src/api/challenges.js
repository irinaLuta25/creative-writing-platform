import http from "./http";

export const apiGetChallenges = () => http.get("/challenge");
export const apiGetChallengeById = (id) => http.get(`/challenge/${id}`);
export const apiGetChallengePieces = (id) => http.get(`/challenge/${id}/pieces`);
