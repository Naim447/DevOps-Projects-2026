
document.getElementById("year").textContent =
    new Date().getFullYear();

document.getElementById("messageButton").addEventListener("click", () => {
    document.getElementById("message").textContent =
        "Welcome! Start planning your Hyderabad adventure.";
});

