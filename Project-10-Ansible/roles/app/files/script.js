// Deployed by Ansible — roles/app/files/script.js
document.addEventListener("DOMContentLoaded", function () {
  var btn = document.getElementById("demoBtn");
  var msg = document.getElementById("demoMsg");
  if (!btn || !msg) return;

  btn.addEventListener("click", function () {
    var now = new Date().toLocaleString();
    msg.textContent = "It works! Button clicked at " + now + " — served by Apache, deployed by Ansible.";
  });
});
