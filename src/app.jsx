class App extends React.Component {
  constructor(props) {
    super(props);

    // Set state - mostly revolves around current song playing
    this.state = {
      currentSong: null,
      songQueue: [],
      currentSongCurrentTime: 0,
      songs: [
        './Assets/song.mp3',
        './Assets/All_I_got.mp3',
        './Assets/Say_My_Name.mp3',
      ],
      currentSongIndex: 0,
      currentTime: 0,
      timerIntervalID: null,
      currentSongLengthString: 'Please choose a song first!',
      currentSongReadyToPlay: false,
    };

    // Bind functions to this
    this.handleSongChoice = this.handleSongChoice.bind(this);
    this.recordNextSongsLength = this.recordNextSongsLength.bind(this);
    this.playSong = this.playSong.bind(this);
    this.pauseSong = this.pauseSong.bind(this);
    this.incrementTimer = this.incrementTimer.bind(this);
    this.startTimer = this.startTimer.bind(this);
    this.stopTimer = this.stopTimer.bind(this);
    this.playNextFromQueue = this.playNextFromQueue.bind(this);
    this.enqueueSong = this.enqueueSong.bind(this);
  }

  componentDidMount() {
    // Enqueue all songs
    for (let i = 0; i < this.state.songs.length; i++) {
      const songURL = this.state.songs[i];
      console.log(songURL);
      this.enqueueSong(songURL);
    }
  }

  enqueueSong(songURL) {
    const song = new Audio(songURL);
    const songQueue = this.state.songQueue;
    songQueue.push(song);
    this.setState({
      songQueue,
    });
  }

  playNextFromQueue() {
    // If queue has songs, get the next one
    if (this.state.songQueue.length) {
      const songQueue = this.state.songQueue.slice();
      console.log(songQueue);
      const song = songQueue.pop();
      this.setState(
        (state) => {
          return {
            currentSong: song,
            songQueue: songQueue,
            currentTime: 0,
            timerIntervalID: null,
            currentSongReadyToPlay: false,
          };
        },
        // Then, update song length on page
        () => {
          this.recordNextSongsLength(song);
        }
      );
    } else {
      alert('No songs in queue. Please enqueue some songs!');
    }
  }

  // TODO - incorporate this
  enablePlayCurrentSong() {
    song.addEventListener('canplay', () => {
      this.setState({currentSongReadyToPlay: true});
    });
  }

  handleSongChoice(event) {
    const song = new Audio(event.target.value);
    console.log(song);
    song.addEventListener('canplay', () => {
      this.recordNextSongsLength(song);
      this.setState({currentSong: song});
    });
  }

  recordNextSongsLength(song) {
    // Iteratively reduce durationRemaining to create time string
    let durationRemaining = Math.floor(song.duration);
    let length = '';
    // If 1+ hours long, record those hours
    if (durationRemaining > 3600) {
      const hours = Math.floor(durationRemaining / 3600);
      length += `${hours}:`;
      durationRemaining -= hours * 3600;
    }
    // If 1+ minutes long, record those minutes
    if (durationRemaining > 60) {
      const minutes = Math.floor(durationRemaining / 60);
      length += `${minutes}:`;
      durationRemaining -= minutes * 60;
    } else {
      length += '0:';
    }
    // If 1+ seconds long, record those seconds
    if (durationRemaining > 0) {
      length += `${durationRemaining}`;
    }
    // Save to state
    this.setState({currentSongLengthString: length});
  }

  playSong() {
    // Start song playback
    if (this.state.currentSong) {
      this.state.currentSong.play();
      // Start timer
      this.startTimer();
    }
  }

  pauseSong() {
    if (this.state.currentSong) {
      this.state.currentSong.pause();
      // Stop timer
      this.stopTimer();
    }
  }

  incrementTimer() {
    const currentTime = this.state.currentSong.currentTime;
    this.setState({
      currentTime: Math.floor(currentTime + 1),
    });
  }

  startTimer() {
    // Update timer every second
    const timerIntervalID = setInterval(this.incrementTimer, 1000);
    // Record id of interval
    this.setState({
      timerIntervalID,
    });
  }

  stopTimer() {
    // Get ID of timer currently running
    const ID = this.state.timerIntervalID;
    // Clear interval with id
    clearInterval(ID);
  }

  render() {
    const {songs} = this.state;
    return (
      <div id='playbackCenter'>
        <select
          name='song-select'
          id='song-select'
          onChange={this.handleSongChoice}
        >
          <option></option>
          <option value={songs[0]}>Flicker</option>
          <option value={songs[1]}>All I Got</option>
          <option value={songs[2]}>Say My Name</option>
        </select>
        <button id='play' onClick={this.playSong}>
          Play
        </button>
        <button id='pause' onClick={this.pauseSong}>
          Pause
        </button>
        <button id='next-song-btn' onClick={this.playNextFromQueue}>
          Next Song
        </button>
        <div id='current-playback-time'>
          Current Playback time: {this.state.currentTime}
        </div>
        <div id='song-length'>
          Song Length: {this.state.currentSongLengthString}
        </div>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.querySelector('#app'));
