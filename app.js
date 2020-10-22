const express = require('express');
const morgan = require('morgan');
const { success, error } = require('./node_modules/functions');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const config = require('./config.json');

const db = mysql.createConnection({
    host: 'localhost',
    port: '3306',
    database: 'nodejs',
    user: 'root',
    password: 'root'
});

db.connect((err) => {
    if (err)
        console.log('error connecting : ' + err)
    else {
        console.log('connected as id ' + db.threadId);

        const app = express();

        db.query('SELECT * FROM members', (err, result) => {
            if (err)
                console.log(err.message )
            else {
                console.log(result[0].name)

                let MembersRouter = express.Router()

            app.use(morgan('dev'));
            app.use(bodyParser.json())
            app.use(bodyParser.urlencoded({ extended: true }))

            // REQUETES C R U D
            MembersRouter.route('/:id')

                //Récupère un membre avec son ID 
                .get((req, res) => {

                    db.query('SELECT * FROM members WHERE id = ?', [req.params.id], (err, result) => {
                        if (err) {
                            res.json(error(err.message))
                        } else {
                            if (result[0] != undefined) {
                                res.json(success(result[0]))
                            } else {
                                res.json(error('id does not exist'))
                            }
                        }
                    })
                })
                    
                // Modifie un membre avec son ID 
                .put((req, res) => {
                    // Ici on vérifie si le nom est bien inséré 
                    if (req.body.name) {

                    } else {
                        res.json(error('No name value...'))
                    }
                    // On cible la donnée par son id 
                    db.query('SELECT * FROM members WHERE id = ?', [req.params.id], (err, result) => {
                        if (err) {
                            res.json(error(err.message))
                        } else {
                            if (result[0] != undefined) {
                                db.query('SELECT * FROM members WHERE name = ? AND id = ?', [req.body.name, req.params.id], (err, result) => {
                                    if (err) {
                                        res.json(error(err.message))
                                    } else {
                                        if (result[0] != undefined) {
                                            res.json(error('same name'))
                                        } else {
                                            db.query('UPDATE members SET name = ? WHERE id = ?', [req.body.name, req.params.id], (err, result) => {
                                                if (err) {
                                                    res.json(error(err.message))
                                                } else {
                                                    res.json(success(true))
                                                }
                                            })
                                        }
                                    }
                                })
                            } else {
                                res.json(error('id does not exist'))
                            }
                        }
                    })
                })

                // Supprime un membre avec son ID 
                .delete((req, res) => {
                    // On vérifie si l'id existe 
                    db.query('SELECT * FROM members WHERE id = ?', [req.params.id], (err, result) => {
                        if (err) {
                            res.json(error(err.message))
                        } else {
                            if (result[0] != undefined) {
                                db.query('DELETE FROM members WHERE id = ?', [req.params.id], (err, result) => {
                                    if (err) {
                                        res.json(error(err.message))
                                    } else {
                                        res.json(success(result))
                                    }
                                })
                            } else {
                                res.json(error('id does not exist'))
                            }
                        }
                    })
                })

            MembersRouter.route('/')
                // Récupère tous les membres 
                .get((req, res) => {
                    if(req.query.max != undefined && req.query.max > 0) {
                        db.query('SELECT * FROM members LIMIT 0, ?', [req.query.max],  (err, result) => {
                            if (err) {
                                res.json(error(err.message));
                            } else {
                                res.json(success(result));
                            }
                        })

                    } else if (req.query.max != undefined){
                        res.json(error('Wrong Max value'));
                    }  else {

                        // Récupération de tous les membres via mysql query 
                        db.query('SELECT * FROM members', (err, result) => {
                            if (err) {
                                res.json(error(err.message));
                            } else {
                                res.json(success(result));
                            }
                        })
                    }
                })
                // Ajoute un membre 
                .post((req, res) => {
                    if (req.body.name) {
                        // ici on vérifie que le nom n'est pas déjà pris
                        db.query('SELECT * FROM members WHERE name = ?', [req.body.name], (err, result) => {
                            if (err) {
                                res.json(error(err.message))
                            } else {
                                if (result[0] != undefined) {
                                    res.json(error('Name already exist...'))
                                } else {
                                    // si le nom est dispo on l'ajoute
                                    db.query('INSERT INTO members(name) VALUES(?)', [req.body.name], (err, result) => {
                                        if (err) {
                                            res.json(error(err.message))
                                        } else {
                                            // on affiche le resultat de l'ajout 
                                            db.query('SELECT * FROM members WHERE name = ?', [req.body.name], (err, result) => {
                                                if (err) {
                                                    res.json(error(err.message))
                                                } else {
                                                    res.json(success(
                                                        result = {
                                                        id: result[0].id,
                                                        name: result[0].name
                                                    }))
                                                }
                                            })
                                        }
                                    })
                                }
                            }
                        })

                    } else {
                        res.json(error('No name value...'));
                    }
                })

                app.use(config.rootAPI + 'members', MembersRouter);

                app.listen(config.port, () => {
                    console.log(`Server started on ${config.port}...`);
                });
            }
        })
    }
});
