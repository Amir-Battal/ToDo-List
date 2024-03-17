const { ipcRenderer } = require("electron");

let form = document.querySelector("form");

form.addEventListener("submit",function(e){
    e.preventDefault();

    let note = document.querySelector(".note").value,
        pickedHours = document.querySelector(".pick-hours").value * 3600000,
        pickedMinutes = document.querySelector(".pick-minutes").value * 60000,
        notificationDate = Date.now();
        notificationDate += (pickedHours + pickedMinutes);
        notificationDate = new Date(notificationDate);

    ipcRenderer.send("add-timed-note", note, notificationDate);
});