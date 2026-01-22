# SoundCloud Music Player

Play your SoundCloud playlists on the web, WITHOUT ADS.

## ⚙️ Setup: Use Your Own Playlist

This is the most important step to customize the player for your own SoundCloud playlist.

### Step 1: Get Your Playlist URL

1. Go to your SoundCloud playlist page
2. Click **Share** > **Embed**
3. Copy the playlist URL (e.g., `https://soundcloud.com/username/sets/playlist-name` or `https://api.soundcloud.com/playlists/1234567890`)

### Step 2: Update the iframe

1. Open `index.html` in a text editor
2. Find the iframe around **line 804-806**:
```html
<iframe id="scPlayer" width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay"
    src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/playlists/1521282808&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false">
</iframe>
```

3. Replace the URL in the `src` attribute. You need to URL-encode your playlist URL. For example:
   - If your playlist URL is: `https://api.soundcloud.com/playlists/1234567890`
   - The encoded version is: `https%3A//api.soundcloud.com/playlists/1234567890`
   - Or use an online URL encoder: https://www.urlencoder.org/

4. Your final iframe should look like:
```html
<iframe id="scPlayer" width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay"
    src="https://w.soundcloud.com/player/?url=YOUR_ENCODED_PLAYLIST_URL&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false">
</iframe>
```

### Step 3: Update Track Names

For better performance and accurate track names, update the hardcoded track list:

1. Find the `TRACK_NAMES` array around **line 818** in `index.html`
2. Replace the array with your own track names in the same order as your playlist:

```javascript
const TRACK_NAMES = [
    "Your First Track Name",
    "Your Second Track Name",
    "Your Third Track Name",
    // ... add all your track names here
];
```

## 🚀 Usage

### Use Locally

1. Download or clone this repository
2. Open `index.html` in your browser
3. That's it! No build process or dependencies needed

### Deploy to GitHub Pages

1. Push your code to a free hosting service like: Netlify, Vercel...

### Use Online

Simply open the `index.html` file in any modern web browser. The player will automatically load your SoundCloud playlist.

## 📝 License

This project is open source and free to use. Customize it to your needs!

## 🤝 Contributing

Feel free to open issues or submit pull requests if you have improvements!

---

**Enjoy your music! 🎶**
