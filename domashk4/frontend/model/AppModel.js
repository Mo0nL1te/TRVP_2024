export default class AppModel {
    static async getTasklists() {
        try {
            const tasklistsResponse = await fetch('http://localhost:4321/tasklists');
            const tasklistsBody = await tasklistsResponse.json();
            if(tasklistsResponse.status !== 200) {
                return Promise.reject(tasklistsBody);
            }
            return tasklistsBody.tasklists;
        } catch(error) {
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: error.message
            });
        }
    }

    static async addTasklist({tasklistID, name, position} = {tasklistID: null, name: '', position: -1}) {
        try {
            const addTasklistsResponse = await fetch(
                'http://localhost:4321/tasklists',
                {
                    method: 'POST',
                    body: JSON.stringify({tasklistID, name, position}),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if(addTasklistsResponse.status !== 200) {
                const addTasklistsBody = await addTasklistsResponse.json();
                return Promise.reject(addTasklistsBody);
            }
            return {
                timestamp: new Date().toISOString(),
                message: `Список задач ${name} был успешно добавлен`
            };
        } catch(error) {
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: error.message
            });
        }
    }

    static async addTask({taskID, text, position, tasklistID, startDate, endDate} = {taskID: null, text: '', position: -1, tasklistID: null, startDate: null, endDate: null}) {
        try {
            const addTaskResponse = await fetch(
                'http://localhost:4321/tasks',
                {
                    method: 'POST',
                    body: JSON.stringify({taskID, text, position, tasklistID, startDate, endDate}),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if(addTaskResponse.status !== 200) {
                const addTaskBody = await addTaskResponse.json();
                return Promise.reject(addTaskBody);
            }
            return {
                timestamp: new Date().toISOString(),
                message: `Задача ${text} была успешно добавлена`
            };
        } catch(error) {
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: error.message
            });
        }
    }

    static async updateTask({taskID, text, position = -1, startDate, endDate} = {taskID: null, text: '', position: -1, startDate: '', endDate: ''}) {
        try {
            const updateTaskResponse = await fetch(
                `http://localhost:4321/tasks/${taskID}`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({text, position, startDate, endDate}),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if(updateTaskResponse.status !== 200) {
                const updateTaskBody = await updateTaskResponse.json();
                return Promise.reject(updateTaskBody);
            }
            return {
                timestamp: new Date().toISOString(),
                message: `Задача ${text} была успешно изменена`
            };
        } catch(error) {
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: error.message
            });
        }
    }

    static async updateTasks({reorderedTasks = []} = {reorderedTasks: []}) {
        try {
            const updateTasksResponse = await fetch(
                `http://localhost:4321/tasks`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({reorderedTasks}),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if(updateTasksResponse.status !== 200) {
                const updateTasksBody = await updateTasksResponse.json();
                return Promise.reject(updateTasksBody);
            }
            return {
                timestamp: new Date().toISOString(),
                message: `Задача ${text} была успешно изменена`
            };
        } catch(error) {
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: error.message
            });
        }
    }

    static async deleteTask({taskID, text} = {taskID: null, text: ''}) {
        try {
            const deleteTaskResponse = await fetch(
                `http://localhost:4321/tasks/${taskID}`,
                {
                    method: 'DELETE',
                }
            );

            if(deleteTaskResponse.status !== 200) {
                const deleteTaskBody = await deleteTaskResponse.json();
                return Promise.reject(deleteTaskBody);
            }
            return {
                timestamp: new Date().toISOString(),
                message: `Задача (ID = ${taskID}) была успешно удалена`
            };
        } catch(error) {
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: error.message
            });
        }
    }

    static async moveTask({taskID, srcTasklistID, destTasklistID} = {taskID: null, srcTasklistID: null, destTasklistID: null}) {
        try {
            const moveTaskResponse = await fetch(
                `http://localhost:4321/tasklists`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({taskID, srcTasklistID, destTasklistID})
                }
            );

            if(moveTaskResponse.status !== 200) {
                const moveTaskBody = await moveTaskResponse.json();
                return Promise.reject(moveTaskBody);
            }
            return {
                timestamp: new Date().toISOString(),
                message: `Задача ${taskID} была успешно перемещена между списками`
            };
        } catch(error) {
            return Promise.reject({
                timestamp: new Date().toISOString(),
                statusCode: 0,
                message: error.message
            });
        }
    }
};