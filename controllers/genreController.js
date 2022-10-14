const Genre = require('../models/genre')
const Book = require('../models/book')
const { body, validationResult } = require("express-validator")
const async = require("async")
const Author = require('../models/author')


exports.genre_list = function(req, res, next){
    Genre.find()
         .sort([["name", "ascending"]])
         .exec(function (err, list_genres){
            if(err){
                return next(err)
            }
            res.render("genre_list", {
                title: "Genre List",
                genre_list: list_genres
            })
         })
}

exports.genre_detail = (req,res,next)=>{
    async.parallel(
        {
            genre(callback){
                Genre.findById(req.params.id).exec(callback)
            },
            genre_books(callback){
                Book.find({ genre: req.params.id }).exec(callback)
            }
        },
        (err, results) => {
            if(err) {
                return next(err)
            }
            if(results.genre == null) {
                const err = new Error("Genre not found")
                err.status = 404;
                return next(err)
            }
            res.render("genre_detail", {
                title: "Genre Detail",
                genre: results.genre,
                genre_books: results.genre_books
            })
        }
    )
}

exports.genre_create_get = (req, res, next) => {
    res.render("genre_form", { title: "Create Genre"})
}

exports.genre_create_post = [
    body("name", "Genre name required").trim().isLength({ min: 1 }).escape(),
    (req, res, next) => {
        const errors = validationResult(req)
        const genre = new Genre({ name: req.body.name })

        if(!errors.isEmpty()) {
            res.render("genre_form", {
                title: "Create Genre", 
                genre,
                errors: errors.array()
            })
            return;
        } else {
            Genre.findOne({ name: req.body.name }).exec((err, found_genre) => {
                if(err) {
                    return next(err)
                }
                if(found_genre){
                    res.redirect(found_genre.url)
                } else {
                    genre.save((err) => {
                        if(err) {
                            return next(err)
                        }
                        res.redirect(genre.url)
                    })
                }
            })
        }
    }
]

exports.genre_delete_get = (req, res, next) => {
    async.parallel(
        {
            genre(callback){
                Genre.findById(req.params.id).exec(callback)
            },
            genres_books(callback){
                Book.find({ genre: req.params.id }).exec(callback)
            }
        },
        (err, results) => {
            if(err){
                return next(err)
            }
            if(results.genre == null){
                res.redirect("/catalog/genres")
            }
            res.render("genre_delete", {
                title: "Delete Genre",
                genre: results.genre,
                genre_books: results.genres_books
            })
        }
    )
}

exports.genre_delete_post = (req, res, next) => {
    async.parallel(
        {
            genre(callback){
                Genre.findById(req.body.genreid).exec(callback)
            },
            genres_books(callback){
                Book.find({ genre: req.body.genreid }).exec(callback)
            }
        },
        (err, results) => {
            if(err){
                return next(err)
            }
            if(results.genres_books.length > 0){
                res.render("genre_delete", {
                    title: "Delete Genre",
                    genre: results.genre,
                    genre_books: results.genres_books
                })
                return
            }
            Genre.findByIdAndRemove(req.body.genreid, (err) => {
                if(err){
                    return next(err)
                }
                res.redirect("/catalog/genres")
            })
        }
    )
}

exports.genre_update_get = (req, res, next) => {
    async.parallel(
        {
            genre(callback){
                Genre.findById(req.params.id)
                .exec(callback)
            }
        },    
        (err, results) => {
            if(err){
                return next(err)
            }
            if(results.genre == null){
                const err = new Error("Genre not found")
                err.status = 404;
                return next(err)
            }
            res.render("genre_form",{
                title: "Update Genre",
                genre: results.genre
            })            
        }
    )
}

exports.genre_update_post = [
    body("name", "Name must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),

    (req, res, next) => {
        const errors = validationResult(req)

        const genre = new Genre({
            name: req.body.name,
            _id: req.params.id
        })     
        if(!errors.isEmpty()){
            async.parallel({},
                (err, results) => {
                    if(err){
                        return next(err)
                    }
                    res.render("genre_form", {
                        title: "Update Genre",        
                        genre,                
                        errors: errors.array()
                    })                    
                }
            )
        }   
        Genre.findByIdAndUpdate(req.params.id, genre, {}, (err, thegenre) => {
            if(err){
                return next(err)
            }
            res.redirect(thegenre.url)
        })
    }
]