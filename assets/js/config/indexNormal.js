const { ipcRenderer } = require("electron");
const connection = require("./connection");

let newNormal = document.querySelector(".todo--normal .add-new-task");

newNormal.addEventListener("click", function(){
    ipcRenderer.send("new-normal");
});

ipcRenderer.on("add-normal-task", function(e, task){
    addNormalTask(task);
});

function addNormalTask(task){
    connection.insert({
        into: 'tasks', 
        values: [{
            note: task
        }]
    }).then(() => showNormal());
}

function deleteTask(taskId){
    return connection.remove({
        from: "tasks",
        where: {
            id: taskId
        }
    }).then(() => showNormal());
}

function updateTask(taskId, taskValue){
    connection.update({
        in: "tasks",
        where: {
            id: taskId
        },
        set: {
            note: taskValue
        }
    }).then(() => showNormal());
}

function showNormal(){
    let clearNormalBtn = document.querySelector(".todo--normal .clear-all");
    let normalTaskList = document.querySelector(".todo--normal__list");
    normalTaskList.innerHTML = "";  

    connection.select({
        from: 'tasks'
    }).then((tasks) => {
        if(tasks.length == 0){
            normalTaskList.innerHTML = ' <li class="empty-list">لا توجد مهام</li>';
            clearNormalBtn.classList.remove("clear-all--show");
        } else {
            clearNormalBtn.classList.add("clear-all--show");
            clearNormalBtn.addEventListener("click", function(){
                return connection.remove({
                    from: 'tasks'
                }).then(() => showNormal())
            });
            for(let task of tasks){
                let listItem = document.createElement("li"),
                    taskInput = document.createElement("input"),
                    deleteBtn = document.createElement("button"),
                    buttonsHolder = document.createElement("div"),
                    updateBtn = document.createElement("button"),
                    exportBtn = document.createElement("button");

                buttonsHolder.classList.add("buttons-holder");

                deleteBtn.innerHTML = "حذف <i class='fas fa-trash-alt'></i>";
                updateBtn.innerHTML = "تحديث <i class='fas fa-cloud-upload-alt'></i>";
                exportBtn.innerHTML = "تصدير <i class='fas fa-file-export'></i>";

                deleteBtn.addEventListener("click", () => {
                    deleteTask(task.id);
                });

                updateBtn.addEventListener("click", () => {
                    updateTask(task.id, taskInput.value);
                });

                exportBtn.addEventListener("click", () => {
                    ipcRenderer.send("create-txt", task.note);
                });

                taskInput.value = task.note;
                buttonsHolder.appendChild(deleteBtn);
                buttonsHolder.appendChild(updateBtn);
                buttonsHolder.appendChild(exportBtn);
                listItem.appendChild(taskInput);
                listItem.appendChild(buttonsHolder);
                normalTaskList.appendChild(listItem);
            }
        }
    })
}

showNormal();