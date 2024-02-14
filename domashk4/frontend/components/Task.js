export default class Task {
  #taskID = null;
  #taskText = '';
  #taskPosition = -1;
  #startDate = null;
  #endDate = null;

  constructor({
    taskID = null,
    text,
    position,
    startDate,
    endDate
  }) {
    this.#taskID = taskID || crypto.randomUUID();
    this.#taskText = text;
    this.#taskPosition = position;
    this.#startDate = startDate;
    this.#endDate = endDate;
  }

  get taskID() { return this.#taskID; }

  get taskText() { return this.#taskText; }
  set taskText(value) {
    if (typeof value === 'string') {
      this.#taskText = value;
    }
  }

  get taskPosition() { return this.#taskPosition; }
  set taskPosition(value) {
    if (typeof value === 'number' && value >= 0) {
      this.#taskPosition = value;
    }
  }

  get taskStartDate() { return this.#startDate; }

  get taskEndDate() { return this.#endDate; }

  render() {
    const liElement = document.createElement('li');
    liElement.classList.add('tasklist__tasks-list-item', 'task');
    liElement.setAttribute('id', this.#taskID);
    liElement.setAttribute('draggable', true);
    liElement.addEventListener('dragstart', (evt) => {
      evt.target.classList.add('task_selected');
      localStorage.setItem('movedTaskID', this.#taskID);
    });
    liElement.addEventListener('dragend', (evt) => evt.target.classList.remove('task_selected'));

    const upperRowDiv = document.createElement('div');
    upperRowDiv.classList.add('upper_task_row');

    const taskText = document.createElement('span');
    taskText.classList.add('task__text');
    taskText.innerHTML = this.#taskText;
    upperRowDiv.appendChild(taskText);

    const editBtn = document.createElement('button');
    editBtn.setAttribute('type', 'button');
    editBtn.classList.add('task__contol-btn', 'edit-icon');
    editBtn.addEventListener('click', () => {
      localStorage.setItem('editTaskID', this.#taskID);
      document.getElementById('modal-edit-task').showModal();
    }); 
    upperRowDiv.appendChild(editBtn);

    liElement.appendChild(upperRowDiv);

    const lowerRowDiv = document.createElement('div');
    lowerRowDiv.classList.add('lower_task_row');

    const DateDiv = document.createElement('div');
    DateDiv.classList.add('date-div');

    const taskStartDate = document.createElement('span');
    taskStartDate.classList.add('task__start-date');
    taskStartDate.innerHTML = new Date(this.#startDate).toLocaleDateString('en-US');
    DateDiv.appendChild(taskStartDate);

    const taskEndDate = document.createElement('span');
    taskEndDate.classList.add('task__end-date');
    taskEndDate.innerHTML = new Date(this.#endDate).toLocaleDateString('en-US');
    DateDiv.appendChild(taskEndDate);

    lowerRowDiv.appendChild(DateDiv);

    const deleteBtn = document.createElement('button');
    deleteBtn.setAttribute('type', 'button');
    deleteBtn.classList.add('task__contol-btn', 'delete-icon');
    deleteBtn.addEventListener('click', () => {
      localStorage.setItem('deleteTaskID', this.#taskID);
      const deleteTaskModal = document.getElementById('modal-delete-task');
      deleteTaskModal.querySelector('.app-modal__question').innerHTML = `Задача ${this.#taskText} будет удалена. Продолжить?`;
      deleteTaskModal.showModal();
    });
    lowerRowDiv.appendChild(deleteBtn);

    liElement.appendChild(lowerRowDiv);

    return liElement;
  }
};
