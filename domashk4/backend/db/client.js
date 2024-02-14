import { query } from 'express';
import pg from 'pg';

export default class DB {
    #dbClient = null;
    #dbHost = '';
    #dbPort = '';
    #dbName = '';
    #dbLogin = '';
    #dbPassword = '';

    constructor() {
        this.#dbHost = process.env.DB_HOST;
        this.#dbPort = process.env.DB_PORT;
        this.#dbName = process.env.DB_NAME;
        this.#dbLogin = process.env.DB_LOGIN;
        this.#dbPassword = process.env.DB_PASSWORD;

        this.#dbClient = new pg.Client({
            user: this.#dbLogin,
            password: this.#dbPassword,
            host: this.#dbHost,
            port: this.#dbPort,
            database: this.#dbName
        });
    }

    async connect() {
        try {
            await this.#dbClient.connect();
            console.log('DB connection established');
        } catch(error) {
            console.error('Unable to connect to DB: ', error);
            return Promise.reject(error);
        }
    }

    async disconnect() {
        await this.#dbClient.end();
        console.log('DB connection was closed');
    }

    async getTasklists() {
        try {
            const tasklists = await this.#dbClient.query(
                'SELECT * FROM billboards_menu ORDER BY position;'
            );
            return tasklists.rows;
        } catch(error) {
            console.log('Unable to get billboards, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });
        }
    }

    async getTasks() {
        try {
            const tasks = await this.#dbClient.query(
                'SELECT * FROM rents ORDER BY date_start;'
            );
            return tasks.rows;
        } catch(error) {
            console.log('Unable to get rents, error: ', error);
            return Promise.reject({
                type: 'internal',
                error
            });
        }
    }

    async addTasklist({tasklistID, name, position = -1} = {tasklistID: null, name: '', position: -1}) {
        if(!tasklistID || !name || position < 0) {
            const errMsg = `Add billboard error wrong params (id: ${tasklistID}, name: ${name}, position: ${position})`;
            console.error(errMsg);
            return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            });
        }

        try {
            await this.#dbClient.query(
                'INSERT INTO billboards_menu(id, name, position) VALUES ($1, $2, $3);',
                [tasklistID, name, position]
            );
        } catch(error) {
            console.log('Unable to add billboard, ', error);
            return Promise.reject({
                type: 'internal',
                error
            });
        }
    }

    async addTask({taskID, text, position = -1, tasklistID, startDate, endDate} = {taskID: null, text: '', position: -1, tasklistID: null, startDate: 0, endDate: 0}) {
        if(!taskID || !text || position < 0 || !tasklistID || !startDate || !endDate) {
            const errMsg = `Add rent error wrong params (id: ${taskID}, text: ${text}, position: ${position}, billboard_ID: ${tasklistID}, startDate: ${startDate}, endDate: ${endDate})`;
            console.error(errMsg);
            return Promise.reject({
                type: 'client',
                error: new Error(errMsg)
            });
        }

        try {
            const options = {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
            };
            await this.#dbClient.query(
                'INSERT INTO rents(id, text, position, bb_id, date_start, date_end) VALUES ($1, $2, $3, $4, $5, $6);',
                [taskID, text, position, tasklistID, startDate, endDate]
            );
            await this.#dbClient.query(
                'UPDATE billboards_menu SET b_rents = array_append(b_rents, $1) WHERE id = $2;',
                [taskID, tasklistID]
            );
        } catch(error) {
            console.log('Unable to add a rent,', error);
            return Promise.reject({
                type: 'internal',
                error
            });
        }
    }

    async updateTask({taskID, text, position, startDate, endDate} = {taskID: null, text: '', position: -1, startDate: '', endDate: ''}) {
        if(!taskID || (!text && position < 0)) {
            const errMsg = `Update rent error, wrong params: (taskID: ${taskID}, text: ${text}, position: ${position}, date_start: ${startDate}, date_end: ${endDate})`;
            console.error(errMsg);
            return Promise.reject({
                type: 'client',
                error
            });
        }

        let query = null;
        const queryParams = [];
        if(text && position >=0 && startDate && endDate) {
            query = 'UPDATE rents SET text = $2, position = $3, date_start = $4, date_end = $5 WHERE id = $1;';
            queryParams.push(taskID, text, position, startDate, endDate);
        } else if(text && startDate && endDate) {
            query = 'UPDATE rents SET text = $2, date_start = $3, date_end = $4 WHERE id = $1;';
            queryParams.push(taskID, text, startDate, endDate);
        } else if(text) {
            query = 'UPDATE rents SET text = $2 WHERE id = $1;';
            queryParams.push(taskID, text);
        } else {
            query = 'UPDATE rents SET position = $2 WHERE id = $1;';
            queryParams.push(taskID, position);
        }

        try {
            await this.#dbClient.query(query, queryParams);
        } catch(error) {
            console.error('Unable update rent,', error);
            return Promise.reject({
                type: 'internal', 
                error
            });
        }
    }

    async deleteTask({taskID} = {taskID: null}) {
        if(!taskID) {
            const errMsg = `Delete rent error, wrong params: (rent_ID: ${taskID})`;
            console.error(errMsg);
            return Promise.reject({
                type: 'client',
                error
            });
        }

        try {
            const queryResult = await this.#dbClient.query(
                'SELECT bb_id FROM rents WHERE id = $1;',
                [taskID]
            );
            const {bb_id: tasklistsID} = queryResult.rows[0];
            await this.#dbClient.query(
                'DELETE FROM rents WHERE id = $1;',
                [taskID]
            );
            await this.#dbClient.query(
                'UPDATE billboards_menu SET b_rents = array_remove(b_rents, $1) WHERE id = $2;',
                [taskID, tasklistsID]
            );
        } catch(error) {
            console.error('Unable delete rent, error: ', error);
            return Promise.reject({
                type: 'internal', 
                error
            });
        }
    }

    async moveTask({taskID, srcTasklistID, destTasklistID} = {taskID: null, srcTasklistID: null, destTasklistID: null}) {
        if(!taskID || !srcTasklistID || !destTasklistID) {
            const errMsg = `Move rent error, wrong params: (rent_ID: ${taskID}, src_billboard_ID: ${srcTasklistID}, dest_billboard_ID: ${destTasklistID})`;
            console.error(errMsg);
            return Promise.reject({
                type: 'client',
                error
            });
        }

        try {
            await this.#dbClient.query(
                'UPDATE rents SET bb_id = $2 WHERE id = $1;',
                [taskID, destTasklistID]
            );
            await this.#dbClient.query(
                'UPDATE billboards_menu SET b_rents = array_append(b_rents, $1) WHERE id = $2;',
                [taskID, destTasklistID]
            );
            await this.#dbClient.query(
                'UPDATE billboards_menu SET b_rents = array_remove(b_rents, $1) WHERE id = $2;',
                [taskID, srcTasklistID]
            );
        } catch(error) {
            console.error('Unable move rent, ', error);
            return Promise.reject({
                type: 'internal',
                error
            });
        }
    }
};