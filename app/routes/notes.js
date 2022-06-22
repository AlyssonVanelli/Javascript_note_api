var express = require('express');
var router = express.Router();
const Note = require('../models/note');
const WithAuth = require('../middlewares/auth')

router.post('/', WithAuth, async function(req, res) {
    const { title, body } = req.body;
    
    try {
        let note = new Note({title: title, body: body, author: req.user._id});
        await note.save();
        res.status(200).json(note);
    } catch (error) {
        res.status(500).json({ error: 'Problem to create a new note'});
    }
})

router.get('/search', WithAuth, async function(req, res) {
    const { query } = req.query;

    try {
        let notes = await Note
            .find({ author: req.user._id })
            .find({ $text: {$search: query }})
            res.json(notes)
    } catch (error) {
        res.json({ error: error}).status(500);
    }
})


router.get('/:id', WithAuth, async (req, res) => {
    try {
        const { id } = req.params;
        let note = await Note.findById(id);
        if (isOwner(req.user, note))
            res.json(note);
        else{
            res.status(403).json({ error: 'Permission denied'});
        }
    } catch (error) {
        res.status(500).json({ error: 'Problem to get a note'});
    }
})

router.get('/', WithAuth, async (req,res) => {
    try {
        let notes = await Note.find({author: req.user._id});
        res.json(notes);
    } catch (error) {
        res.json({ error: error}).status(500)
    }
})

router.put('/:id', WithAuth, async (req, res) => {
    const { title, body } = req.body;
    const { id } = req.params;

    try {
        let notes = await Note.findById(id);
        if(isOwner(req.user, notes)) {
            let note = await Note.findOneAndUpdate(id, 
                { $set: { title: title, body: body} },
                { upset: true, 'new': true}    
            );
            res.json(note);
        }else{
            res.status(403).json({ error: 'Permission denied'});
        }
    } catch (error) {
        res.status(500).json({ error: 'Problem to update a note'});
    }
})

router.delete('/:id', WithAuth, async (req, res) => {
    const { id } = req.params;

    try {
        let notes = await Note.findById(id);
        if(isOwner(req.user, notes)){
            await notes.delete();
            res.json({message: "ok"}).status(204);
        }else{
            res.status(403).json({ error: 'Permission denied'});
        }
    } catch (error) {
        res.status(500).json({ error: 'Problem to delete a note'});
    }
})

const isOwner = (user, note) => {
    if(JSON.stringify(user._id) == JSON.stringify(note.author._id))
        return true;
    else{
        return false;
    }
}

module.exports = router;