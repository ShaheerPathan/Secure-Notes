const express = require('express');
const Note = require('../models/Note');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
    try {
        const notes = await Note.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const { title, content } = req.body;
        
        const note = new Note({
            title,
            content,
            userId: req.userId
        });
        
        await note.save();
        res.status(201).json(note);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const { title, content } = req.body;
        
        const note = await Note.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { title, content },
            { new: true }
        );
        
        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }
        
        res.json(note);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const note = await Note.findOneAndDelete({
            _id: req.params.id,
            userId: req.userId
        });
        
        if (!note) {
            return res.status(404).json({ message: 'Note not found' });
        }
        
        res.json({ message: 'Note deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;