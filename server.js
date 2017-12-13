var express = require('express')
var bodyParser = require('body-parser');
var path = require('path')
const fs = require('fs');
//const content = JSON.stringify(output);

var PORT = process.env.PORT || 8080;
var PATH_TO_TASKS = './tasks.json';

var app = express()
app.use(bodyParser.json());


var options = {
  extensions: ['htm', 'html'],
  index: true,
  setHeaders: function (res, path, stat) {
    res.set('x-timestamp', Date.now())
  }
}

/*
 * load tasks from file
 */
var tasks = require(PATH_TO_TASKS);

if (!Array.isArray(tasks)) {
  console.error("Failed to load tasks from database");
  process.exit(1);
} else {
  console.info("loaded " + tasks.length + " tasks.")
}

/*
 * return all tasks
 */
function getAllTasks(req, res) {
  res.setHeader('Content-Type', 'application/json'); // ist das eine Methode? 

  tasks = updateTotalDuration(tasks);

  res.send(JSON.stringify(tasks));

}

/*
 * return one specific task, not found otherwise
 */
function getOneTask(req, res) {
  res.setHeader('Content-Type', 'application/json');

  var id = req.params.id || '';
  var task = tasks.find(function (task) { return task.id == id; });

  if (!task) {
    res.sendStatus(404)
  }

  res.send(JSON.stringify(task));
}

/*
* saves a new Task to the internal memory and then to the file
*/
function saveNewTask(req, res) {
  // nimm aus req.body die zu speichernde Task und packe sie in eie Variable
  var newTask = req.body;


  // generier eine neue ID und speichere diese in newTask
  var id = "aufgabe_" + (tasks.length + 1)
  newTask.id = id;

  // füge ein leeres Array hinzu
  newTask.efforts = [];

  // füge die neue Task zu der variable tasks. 
  tasks.push(newTask);

  // hint: tasks ist ein array. mit tasks.push(task) kannst du task in tasks speichern
  var text = JSON.stringify(tasks);

  // save changes to file
  fs.writeFileSync(PATH_TO_TASKS, text)

  res.sendStatus(204) // sagt dem browser, dass alles ok ist (Die Anfrage wurde erfolgreich durchgeführt, die Antwort enthält jedoch bewusst keine Daten.)
}

/*
* saves new effort for a given task (by id) to the internal memory and then to the file
*/
function saveNewEffort(req, res) {
  var id = req.params.id || '';
  var task = tasks.find(function (task) { return task.id == id; });

  if (!task) {
    res.sendStatus(404)
  }

  // nimm aus req.body die zu speichernde Task und packe sie in eie Variable
  var newEffort = {
    "description": req.body.name,
    "date": req.body.date,
    "amount": parseInt(req.body.time, 10)
  };

  // füge die neue Task zu der variable tasks. 
  task.efforts.push(newEffort);

  // calculate new stuff
  tasks = updateTotalDuration(tasks);

  // hint: tasks ist ein array. mit tasks.push(task) kannst du task in tasks speichern
  var text = JSON.stringify(tasks);

  // save changes to file
  fs.writeFileSync(PATH_TO_TASKS, text)

  res.sendStatus(204) // sagt dem browser, dass alles ok ist (Die Anfrage wurde erfolgreich durchgeführt, die Antwort enthält jedoch bewusst keine Daten.)
}

// helper function to update the total duration
function updateTotalDuration(tasks) {
  tasks.forEach(function (task) {

    var amountHoursSpent = 0;
    var efforts = task.efforts;

    if (!Array.isArray(efforts)) {
      efforts = [];
    }

    efforts.forEach(function (effort) {
      amountHoursSpent += effort.amount;

    });
    task.durationTotal = amountHoursSpent;
  });

  return tasks;
}

/*
 * register handlers that the frontend is using
 */
app.use('/', express.static('html'));
app.get('/api/tasks', getAllTasks)
app.get('/api/tasks/:id', getOneTask)

app.post('/api/tasks', saveNewTask)
app.post('/api/tasks/:id', saveNewEffort)


// start the server
app.listen(PORT, function () {
  console.log('App started on port:' + PORT);
});