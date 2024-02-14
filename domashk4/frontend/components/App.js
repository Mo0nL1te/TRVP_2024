import Tasklist from './Tasklist';
import AppModel from '../model/AppModel';

export default class App {
  #tasklists = [];

  onEscapeKeydown = (event) => {
    if (event.key === 'Escape') {
      const input = document.querySelector('.tasklist-adder__input');
      input.style.display = 'none';
      input.value = '';

      document.querySelector('.tasklist-adder__btn')
        .style.display = 'inherit';
    }
  };

  onInputKeydown = async (event) => {
    if (event.key !== 'Enter') return;

    if (event.target.value) {
      const tasklistID = crypto.randomUUID();
      try {
        const addTasklistResult = await AppModel.addTasklist({
          tasklistID,
          name: event.target.value,
          position: this.#tasklists.length
        });
        const newTasklist = new Tasklist({
          tasklistID,
          name: event.target.value,
          position: this.#tasklists.length,
          onDropTaskInTasklist: this.onDropTaskInTasklist,
          addNotification: this.addNotification
        });

        this.#tasklists.push(newTasklist);
        newTasklist.render();

        this.addNotification({text: addTasklistResult.message, type: 'success'});
      } catch(error) {
        this.addNotification({text: error.message, type: 'error'});
        console.error(error);
      }
    }

    event.target.style.display = 'none';
    event.target.value = '';

    document.querySelector('.tasklist-adder__btn')
      .style.display = 'inherit';
  };

  onDropTaskInTasklist = async (evt) => {
    evt.stopPropagation();

    const destTasklistElement = evt.currentTarget;
    destTasklistElement.classList.remove('tasklist_droppable');

    const movedTaskID = localStorage.getItem('movedTaskID');
    const srcTasklistID = localStorage.getItem('srcTasklistID');
    const destTasklistID = destTasklistElement.getAttribute('id');

    localStorage.setItem('movedTaskID', '');
    localStorage.setItem('srcTasklistID', '');

    if (!destTasklistElement.querySelector(`[id="${movedTaskID}"]`)) return;

    const srcTasklist = this.#tasklists.find(tasklist => tasklist.tasklistID === srcTasklistID);
    const destTasklist = this.#tasklists.find(tasklist => tasklist.tasklistID === destTasklistID);
    try {
      if (srcTasklistID !== destTasklistID) {
        await AppModel.moveTask({taskID: movedTaskID, srcTasklistID, destTasklistID});

        const movedTask = srcTasklist.deleteTask({taskID: movedTaskID});
        destTasklist.pushTask({ task: movedTask });
  
        srcTasklist.reorderTasks();
      }
  
      await destTasklist.reorderTasks();
      this.addNotification({text: `Задача была успешно перемещена в список ${destTasklist.name}`, type: 'success'});
    } catch(error) {
      this.addNotification({text: error.message, type: 'error'});
      console.error(error);
    }
  };

  editTask = async ({taskID, newTaskText, editedStartDate, editedEndDate}) => {
    let fTask = null;
    for (let tasklist of this.#tasklists) {
      fTask = tasklist.getTaskById({ taskID });
      if (fTask) break;
    }

    try {
      const updateTaskResult = await AppModel.updateTask({taskID, text: newTaskText, startDate: editedStartDate, endDate: editedEndDate});

      fTask.taskText = newTaskText;
      fTask.startDate = editedStartDate;
      fTask.endDate = editedEndDate;
      document.querySelector(`[id="${taskID}"] span.task__text`).innerHTML = newTaskText;
      document.querySelector(`[id="${taskID}"] span.task__start-date`).innerHTML = new Date(editedStartDate).toLocaleDateString('en-US');
      document.querySelector(`[id="${taskID}"] span.task__end-date`).innerHTML = new Date(editedEndDate).toLocaleDateString('en-US');

      this.addNotification({text: updateTaskResult.message, type: 'success'});
    } catch(error) {
      this.addNotification({text: error.message, type: 'error'});
      console.error(error);
    }
  };

  deleteTask = async ({ taskID }) => {
    let fTask = null;
    let fTasklist = null;
    for (let tasklist of this.#tasklists) {
      fTasklist = tasklist;
      fTask = tasklist.getTaskById({ taskID });
      if (fTask) break;
    }

    try {
      const deleteTaskResult = await AppModel.deleteTask({taskID});

      fTasklist.deleteTask({ taskID });
      document.getElementById(taskID).remove();

      this.addNotification({text: deleteTaskResult.message, type: 'success'});
    } catch(error) {
      this.addNotification({text: error.message, type: 'error'});
      console.error(error);
    }
  };

  initAddTaskModal() {
    const addTaskModal = document.getElementById('modal-add-task');

    const cancelHandler = () => {
      addTaskModal.close();
      localStorage.setItem('addTaskTasklistID', '');
      localStorage.setItem('addTaskStartTime', '');
      localStorage.setItem('addTaskEndTime', '');
      addTaskModal.querySelector('.app-modal__input').value = '';
      addTaskModal.querySelector('.app-modal__sdate-input').value = '';
      addTaskModal.querySelector('.app-modal__edate-input').value = '';
    };

    const okHandler = () => {
      const tasklistID = localStorage.getItem('addTaskTasklistID');
      const modalInput = addTaskModal.querySelector('.app-modal__input');
      const startDate = addTaskModal.querySelector('.app-modal__sdate-input');
      const endDate = addTaskModal.querySelector('.app-modal__edate-input');

      const A1 = new Date(startDate.value);
      const A2 = new Date(endDate.value);
      let flag = 0;

      if(tasklistID && startDate.value && endDate.value && modalInput.value) {
        const fTasklist = this.#tasklists.find(tasklist => tasklist.tasklistID === tasklistID);
        if(fTasklist.tasklistTasks.length > 0) {
          for (let task of fTasklist.tasklistTasks) {
            let B1 = new Date(task.taskStartDate);
            let B2 = new Date(task.taskEndDate);
            if(!(A1 >= B2 || B1 >= A2)) { flag = 1; break; }
          }
        }
        flag === 1 
        ? this.addNotification({text: 'Аренда на данный промежуток времени недоступна', type: 'error'})
        : this.#tasklists.find(tasklist => tasklist.tasklistID === tasklistID).appendNewTask({
          text: modalInput.value,
          startDate: startDate.value,
          endDate: endDate.value
        });;
      } else if(!modalInput.value || !startDate.value || !endDate.value) {
        this.addNotification({text: 'Пожалуйста, введите все необходимые данные', type: 'error'});
      }

      cancelHandler();
    };

    addTaskModal.querySelector('.modal-ok__btn').addEventListener('click', okHandler);
    addTaskModal.querySelector('.modal-cancel__btn').addEventListener('click', cancelHandler);
    addTaskModal.addEventListener('close', cancelHandler);
  }

  initEditTaskModal() {
    const editTaskModal = document.getElementById('modal-edit-task');

    const cancelHandler = () => {
      editTaskModal.close();
      localStorage.setItem('editTaskID', '');
      editTaskModal.querySelector('.app-modal__input').value = '';
      editTaskModal.querySelector('.app-modal__sdate-input').value = '';
      editTaskModal.querySelector('.app-modal__edate-input').value = '';
    };

    const okHandler = () => {
      let fTask = null;
      let fTasklist = null;
      let flag = 0;
      const taskID = localStorage.getItem('editTaskID');
      const modalInput = editTaskModal.querySelector('.app-modal__input');
      const startDate = editTaskModal.querySelector('.app-modal__sdate-input');
      const endDate = editTaskModal.querySelector('.app-modal__edate-input');

      if(taskID && startDate.value && endDate.value && modalInput.value) {
        for (let tasklist of this.#tasklists) {
          fTasklist = tasklist;
          fTask = tasklist.getTaskById({ taskID });
          if (fTask) break;
        }
        if(fTasklist.tasklistTasks.length > 0) {
          const A1 = new Date(startDate.value);
          const A2 = new Date(endDate.value);
          for (let task of fTasklist.tasklistTasks) {
            let B1 = new Date(task.taskStartDate);
            let B2 = new Date(task.taskEndDate);
            if(!(A1 >= B2 || B1 >= A2)) { flag = 1; break; }
          }  
        }
        flag === 1
          ? this.addNotification({text: 'Аренда на данный промежуток времени недоступна', type: 'error'})
          : this.editTask({taskID, newTaskText: modalInput.value, editedStartDate: startDate.value, editedEndDate: endDate.value});
      } else if(!modalInput.value || !startDate.value || !endDate.value) {
        this.addNotification({text: 'Пожалуйста, введите все необходимые данные', type: 'error'});
      }

      cancelHandler();
    };

    editTaskModal.querySelector('.modal-ok__btn').addEventListener('click', okHandler);
    editTaskModal.querySelector('.modal-cancel__btn').addEventListener('click', cancelHandler);
    editTaskModal.addEventListener('close', cancelHandler);
  }

  initDeleteTaskModal() {
    const deleteTaskModal = document.getElementById('modal-delete-task');

    const cancelHandler = () => {
      deleteTaskModal.close();
      localStorage.setItem('deleteTaskID', '');
    };

    const okHandler = () => {
      const taskID = localStorage.getItem('deleteTaskID');
      if(taskID) {
        this.deleteTask({taskID});
      }

      cancelHandler();
    };

    deleteTaskModal.querySelector('.modal-ok__btn').addEventListener('click', okHandler);
    deleteTaskModal.querySelector('.modal-cancel__btn').addEventListener('click', cancelHandler);
    deleteTaskModal.addEventListener('close', cancelHandler);
  }

  initNotifications() {
    const notifications = document.getElementById('app-notifications');
    notifications.show();
  }

  addNotification = ({text, type}) => {
    const notifications = document.getElementById('app-notifications');
    const notificationID = crypto.randomUUID();
    const notification = document.createElement('div');
    notification.classList.add('notification', type === 'success' ? 'notification-success' : 'notification-error');
    notification.setAttribute('id', notificationID);
    notification.innerHTML = text;
    notifications.appendChild(notification);
    setTimeout(() => {document.getElementById(notificationID).remove();}, 5000);
  }

  async init() {
    document.querySelector('.tasklist-adder__btn')
      .addEventListener(
        'click',
        (event) => {
          event.target.style.display = 'none';

          const input = document.querySelector('.tasklist-adder__input');
          input.style.display = 'inherit';
          input.focus();
        }
      );

    document.addEventListener('keydown', this.onEscapeKeydown);

    document.querySelector('.tasklist-adder__input')
      .addEventListener('keydown', this.onInputKeydown);

    document.getElementById('theme-switch')
      .addEventListener('change', (evt) => {
        (evt.target.checked
          ? document.body.classList.add('dark-theme')
          : document.body.classList.remove('dark-theme'));
      });

      this.initAddTaskModal();
      this.initEditTaskModal();
      this.initDeleteTaskModal();
      this.initNotifications();

    document.addEventListener('dragover', (evt) => {
      evt.preventDefault();

      const draggedElement = document.querySelector('.task.task_selected');
      const draggedElementPrevList = draggedElement.closest('.tasklist');

      const currentElement = evt.target;
      const prevDroppable = document.querySelector('.tasklist_droppable');
      let curDroppable = evt.target;
      while (!curDroppable.matches('.tasklist') && curDroppable !== document.body) {
        curDroppable = curDroppable.parentElement;
      }

      if (curDroppable !== prevDroppable) {
        if (prevDroppable) prevDroppable.classList.remove('tasklist_droppable');

        if (curDroppable.matches('.tasklist')) {
          curDroppable.classList.add('tasklist_droppable');
        }
      }

      if (!curDroppable.matches('.tasklist') || draggedElement === currentElement) return;

      if (curDroppable === draggedElementPrevList) {
        if (!currentElement.matches('.task')) return;

        const nextElement = (currentElement === draggedElement.nextElementSibling)
          ? currentElement.nextElementSibling
          : currentElement;

        curDroppable.querySelector('.tasklist__tasks-list')
          .insertBefore(draggedElement, nextElement);

        return;
      }

      if (currentElement.matches('.task')) {
        curDroppable.querySelector('.tasklist__tasks-list')
          .insertBefore(draggedElement, currentElement);

        return;
      }

      if (!curDroppable.querySelector('.tasklist__tasks-list').children.length) {
        curDroppable.querySelector('.tasklist__tasks-list')
          .appendChild(draggedElement);
      }
    });

    try {
      const tasklists = await AppModel.getTasklists();
      for(const tasklist of tasklists) {
        const tasklistObj = new Tasklist({
          tasklistID: tasklist.tasklistsID,
          name: tasklist.name,
          position: tasklist.position,
          onDropTaskInTasklist: this.onDropTaskInTasklist,
          addNotification: this.addNotification
        });

        this.#tasklists.push(tasklistObj);
        tasklistObj.render();

        for(const task of tasklist.tasks) {
          tasklistObj.addNewTaskLocal({
            taskID: task.taskID,
            text: task.text,
            position: task.position,
            startDate: task.startDate,
            endDate: task.endDate
          });
        }
      }
    } catch(error) {
      this.addNotification({text: error.message, type: 'error'});
      console.error(error);
    }
  }
};
