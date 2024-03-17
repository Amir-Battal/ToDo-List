const { ipcRenderer } = require("electron");
const connection = require("./connection");

let newTimed = document.querySelector(".todo--timed .add-new-task");

newTimed.addEventListener("click", function(){
    ipcRenderer.send("new-timed");
})

ipcRenderer.on('add-timed-note', function (e, note, notificationTime) {
    addTimedTask(note, notificationTime);
});

function addTimedTask(note, notificationTime) {
    connection.insert({
        into: 'timed',
        values: [{
            note: note,
            pick_status: 0,
            pick_time: notificationTime
        }]
    }).then(() => showTimed());
}

function deleteTimedTask(taskId){
    return connection.remove({
        from: "timed",
        where: {
            id: taskId
        }
    }).then(() => showTimed());
}

function updateTimedTask(taskId, taskValue){
    connection.update({
        in: "timed",
        where: {
            id: taskId
        },
        set: {
            note: taskValue
        }
    }). then(() => showTimed());
}

function showTimed(){
    let clearTimedBtn = document.querySelector(".todo--timed .clear-all");
    let timedList = document.querySelector(".todo--timed__list");
    timedList.innerHTML = '';

    connection.select({
        from: 'timed'
    }).then((tasks) => {
        if (tasks.length == 0) {
            timedList.innerHTML = '<li class="empty-list">لا توجد مهام</li>';
            timedList.innerHTML = '<li class="empty-list">لا توجد مهام</li>';
            clearTimedBtn.classList.remove("clear-all--show");
        } else {
            clearTimedBtn.classList.add("clear-all--show");
            clearTimedBtn.addEventListener("click", function(){
                return connection.remove({
                    from: "timed"
                }).then(() => showTimed());
            });
            for(let task of tasks){
                let listItem = document.createElement("li"),
                    taskInput = document.createElement("input"),
                    timeHolder = document.createElement("div"),
                    deleteBtn = document.createElement("button"),
                    buttonsHolder = document.createElement("div"),
                    updateBtn = document.createElement("button"),
                    exportBtn = document.createElement("button");

                timeHolder.classList.add("time-holder");
                buttonsHolder.classList.add("buttons-holder");

                deleteBtn.innerHTML = "حذف <i class='fas fa-trash-alt'></i>";
                updateBtn.innerHTML = "تحديث <i class='fas fa-cloud-upload-alt'></i>";
                exportBtn.innerHTML = "تصدير <i class='fas fa-file-export'></i>";
                
                taskInput.value = task.note;

                deleteBtn.addEventListener("click", function(){
                    deleteTimedTask(task.id);
                });

                updateBtn.addEventListener("click", function(){
                    updateTimedTask(task.id, taskInput.value);
                });

                exportBtn.addEventListener("click", function(){
                    ipcRenderer.send("create-txt", task.note);
                });

                if (task.pick_status === 1) {
                    timeHolder.innerHTML = "جرى التنبيه فى الساعة " + task.pick_time.toLocaleTimeString();
                } else {
                    timeHolder.innerHTML = "يتم التنبيه فى الساعة " + task.pick_time.toLocaleTimeString();
                }

                let checkInterval = setInterval(function () {
                    let currentDate = new Date();

                    if (task.pick_time.toString() === currentDate.toString()) {
                        ipcRenderer.send("notify", task.note);

                        connection.update({
                            in: 'timed',
                            where: {
                                id: task.id
                            },
                            set: {
                                pick_status: 1
                            }
                        }).then(() => showTimed());

                        clearInterval(checkInterval);
                    }

                }, 1000);

                buttonsHolder.appendChild(deleteBtn);
                buttonsHolder.appendChild(updateBtn);
                buttonsHolder.appendChild(exportBtn);
                listItem.appendChild(taskInput);
                listItem.appendChild(timeHolder);
                listItem.appendChild(buttonsHolder);
                timedList.appendChild(listItem);
            }
        }
    });
}

showTimed();