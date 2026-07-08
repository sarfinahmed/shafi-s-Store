fetch("https://api.f9bazar.com/check.php?uid=12345678", {
  method: "GET"
}).then(res => {
  console.log("CORS check success", res.status);
}).catch(err => {
  console.log("CORS check failed", err.message);
});
