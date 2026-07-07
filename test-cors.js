const payload = {
  sectionName: "AllData",
  PlayerUid: "12345678",
  region: "BD",
  useruid: "npRhVL3REnh756zhsL1Otn1BEyi1",
  api: "GnNm9vQ4Zb5ZYSj2fYf2FKkxwsz0Ub"
};
fetch("https://proapis.hlgamingofficial.com/main/games/freefire/account/api", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
}).then(res => {
  console.log("CORS check success", res.status);
}).catch(err => {
  console.log("CORS check failed", err.message);
});
