CREATE DATABASE task_manager IF NOT EXISTS;

CREATE TABLE IF NOT EXISTS tasklists (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    position INTEGER NOT NULL CHECK (position >= 0),
    tasks UUID[] DEFAULT '{}'
    );

 CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY,
    text VARCHAR(200) NOT NULL,
    position INTEGER NOT NULL CHECK (position >= 0),
    tasklist_id UUID REFERENCES tasklists
    );

-- User (actions: SELECT, INSERT, UPDATE, DELETE)
CREATE ROLE tm_admin LOGIN ENCRYPTED PASSWORD '1234';
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks, tasklists TO tm_admin;

-- SQL Queries
SELECT * FROM tasklists ORDER BY position;
SELECT * FROM tasks ORDER BY tasklist_id, position;

-- create new tasklist
INSERT INTO tasklists(id, name, position) VALUES (<id>, <name>, <pos>);

-- create new task
INSERT INTO tasks(id, text, position, tasklist_id) VALUES (<task_id>, <name>, <pos>, <tasklist_id>);
UPDATE tasklists SET tasks = array_append(tasks, <task_id>) WHERE id = <tasklist_id>;

-- change task text, position
UPDATE tasks SET text = <text>, position = <position> WHERE id = <id>;

-- remove task
SELECT tasklist_id FROM tasks WHERE id = <task_id>;
DELETE FROM tasks WHERE id = <task_id>;
UPDATE tasklists SET tasks = array_remove(tasks, <task_id>) WHERE id = <tasklist_id>;

-- move task
UPDATE tasks SET tasklist_id = <dest_tasklist_id> WHERE id = <id>;
UPDATE tasklists SET tasks = array_append(tasks, <task_id>) WHERE id = <dest_tasklist_id>;
UPDATE tasklists SET tasks = array_remove(tasks, <task_id>) WHERE id = <src_tasklist_id>;
