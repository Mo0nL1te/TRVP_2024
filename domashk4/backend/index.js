import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import DB from './db/client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
    path: './backend/.env'
});

const appHost = process.env.APP_HOST;
const appPort = process.env.APP_PORT;

const app = express();
const db = new DB();

// logging middleware
app.use('*', (req, res, next) => {
    console.log(req.method, req.baseUrl || req.url, new Date().toISOString());
    next();
})

// middleware for static app files
app.use('/', express.static(path.resolve(__dirname, '../dist')));

// get tasklists and tasks
app.get('/tasklists', async (req, res) => {
    try {
        const [dbTasklists, dbTasks] = await Promise.all([db.getTasklists(), db.getTasks()]);
        const dateOptions = {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        };
        const tasks = dbTasks.map(({id, text, position, date_start, date_end}) => 
            ({taskID: id, text, position, startDate: date_start, endDate: date_end}));
        const tasklists = dbTasklists.map(tasklist => ({
            tasklistsID: tasklist.id,
            name: tasklist.name,
            position: tasklist.position,
            tasks: tasks.filter(task => tasklist.b_rents.indexOf(task.taskID) !== -1),
        }));

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.json({tasklists});
    } catch(err) {
        res.statusCode = 500;
        res.statusMessage = 'Internal server error';
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: 500,
            message: `Getting tasklists and tasks failed, error: ${err.error}`
        });
    }
});

// tasklists
// body parsing middleware
app.use('/tasklists', express.json());

// add tasklists
app.post('/tasklists', async (req, res) => {
    try {
         const {tasklistID, name, position} = req.body;
         await db.addTasklist({tasklistID, name, position});
         res.statusCode = 200;
         res.statusMessage = 'OK';
         res.send();
    } catch(err) {
        switch(err.type) {
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;
            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
        }
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Add tasklists error: ${err.error.message || err.error}`
        });
    }
});


// tasks
// body parsing middleware
app.use('/tasks', express.json());

// add tasks
app.post('/tasks', async (req, res) => {
    try {
         const {taskID, text, position, tasklistID, startDate, endDate} = req.body;
         await db.addTask({taskID, text, position, tasklistID, startDate, endDate});
         res.statusCode = 200;
         res.statusMessage = 'OK';
         res.send();
    } catch(err) {
        switch(err.type) {
            case 'client':
                res.statusCode = 400;
                res.statusMessage = 'Bad request';
                break;
            default:
                res.statusCode = 500;
                res.statusMessage = 'Internal server error';
        }
        res.json({
            timestamp: new Date().toISOString(),
            statusCode: res.statusCode,
            message: `Add task error: ${err.error.message || err.error}`
        });
    }
});

// body parsing middleware
app.use('/tasks/:taskID', express.json());

// edit task params
app.patch('/tasks/:taskID', async (req, res) => {
    try {
        const {taskID} = req.params;
        const {text, position, startDate, endDate} = req.body;
        await  db.updateTask({taskID, text, position, startDate, endDate});
        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();
   } catch(err) {
       switch(err.type) {
           case 'client':
               res.statusCode = 400;
               res.statusMessage = 'Bad request';
               break;
           default:
               res.statusCode = 500;
               res.statusMessage = 'Internal server error';
       }
       res.json({
           timestamp: new Date().toISOString(),
           statusCode: res.statusCode,
           message: `Update task error: ${err.error}`
       });
   }
});

// edit multiple tasks params
app.patch('/tasks', async (req, res) => {
    try {
        const {reorderedTasks} = req.body;
        await Promise.all(reorderedTasks.map(({taskID, position}) => db.updateTask({taskID, position})));

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();
   } catch(err) {
       switch(err.type) {
           case 'client':
               res.statusCode = 400;
               res.statusMessage = 'Bad request';
               break;
           default:
               res.statusCode = 500;
               res.statusMessage = 'Internal server error';
       }
       res.json({
           timestamp: new Date().toISOString(),
           statusCode: res.statusCode,
           message: `Update multiple tasks error: ${err.error.message || err.error}`
       });
    }
});

app.delete('/tasks/:taskID', async (req, res) => {
    try {
        const {taskID} = req.params;
        await db.deleteTask({taskID});

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();
   } catch(err) {
       switch(err.type) {
           case 'client':
               res.statusCode = 400;
               res.statusMessage = 'Bad request';
               break;
           default:
               res.statusCode = 500;
               res.statusMessage = 'Internal server error';
       }
       res.json({
           timestamp: new Date().toISOString(),
           statusCode: res.statusCode,
           message: `Delete task error: ${err.error.message || err.error}`
       });
   }
});

// move task
app.patch('/tasklists', async (req, res) => {
    try {
        const {taskID, srcTasklistID, destTasklistID} = req.body;
        await  db.moveTask({taskID, srcTasklistID, destTasklistID});

        res.statusCode = 200;
        res.statusMessage = 'OK';
        res.send();
   } catch(err) {
       switch(err.type) {
           case 'client':
               res.statusCode = 400;
               res.statusMessage = 'Bad request';
               break;
           default:
               res.statusCode = 500;
               res.statusMessage = 'Internal server error';
       }
       res.json({
           timestamp: new Date().toISOString(),
           statusCode: res.statusCode,
           message: `Move task error: ${err.error.message || err.error}`
       });
   }
});

// app
const server = app.listen(Number(appPort), appHost, async () => {
    try {
        await db.connect();
    } catch(err) {
        console.log('Task manager app shut down');
        process.exit(100);
    }

    console.log(`Task manager app started at host http://${appHost}:${appPort}`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing connection');
    server.close(async () => {
        await db.disconnect();
        console.log('HTTP server closed');
    });
});