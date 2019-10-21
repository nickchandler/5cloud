/* eslint-disable camelcase */

import SongPlayer from './SongPlayer';

// Calculate relative date posted
const calculateDatePosted = (dateInteger) => {
  const today = Date.now();
  const daysSince = Math.round((today - dateInteger) / (1000 * 60 * 60 * 24));
  // If in years, record years
  if (548 > daysSince >= 350) {
    return `${Math.round(daysSince / 365, 0)} year ago`;
  }
  if (daysSince >= 350) {
    return `${Math.round(daysSince / 365, 0)} years ago`;
  }
  // If in months, record months
  if (45 > daysSince >= 27) {
    return `${Math.round(daysSince / 30, 0)} month ago`;
  }
  if (daysSince >= 27) {
    return `${Math.round(daysSince / 30, 0)} months ago`;
  }
  // If in weeks, record weeks
  if (daysSince === 7) {
    return `${Math.round(daysSince / 8, 0)} week ago`;
  }
  if (daysSince >= 6) {
    return `${Math.round(daysSince / 7, 0)} weeks ago`;
  }
  // If in days, record days
  if (daysSince === 1) {
    return `${Math.round(daysSince, 0)} day ago`;
  }
  if (daysSince > 1) {
    return `${Math.round(daysSince, 0)} days ago`;
  }
  // If in hours, record hours
  if (daysSince >= 1 / 24) {
    return `${Math.round(daysSince / 24, 1)} hours ago`;
  }
  // If in minutes, record minutes
  if (daysSince >= 1 / 1440) {
    return `${Math.round(daysSince / 1440, 0)} minutes ago`;
  }
  // If in seconds, record < 1 minute
  if (daysSince <= 1 / 1440) {
    return 'Less than a minute ago';
  }
};

// Calculate the playback time in mm:ss
const calculateMMSS = (seconds) => {
  var secondsInt = parseInt(seconds, 10);
  var minutes = Math.floor(secondsInt / 60) % 60;
  var seconds = secondsInt % 60;

  seconds = seconds < 10 ? '0' + seconds : seconds;

  return [minutes, seconds].filter((v, i) => v !== '00' || i > 0).join(':');
};

export default class App extends React.Component {
  constructor(props) {
    super(props);

    // Set state - mostly revolves around current song playing
    this.state = {
      // Song Audio is a JS Audio object
      currentSongAudio: new Audio(),
      // Store current song's metadata
      currentSongObj: {
        Id: 0,
        song_id: '',
        song_name: '',
        artist_name: '',
        upload_time: 0,
        tag: '',
        song_art_url: '',
        song_data_url: '',
        background_light: '(140, 172, 204)',
        background_dark: '(102, 97, 98)',
        waveform_data: '',
        song_duration: 0,
        currentTime: 0,
        currentTimeMMSS: '00',
        durationMMSS: '00:00',
        waveform_data: '',
      },
      songQueueAudio: [],
      songQueueObjects: [],
      songObjs: [],
      // Store ID of interval for timer
      timerIntervalID: null,
      playButtonState: 'play',
      // Record ids of songs already played
      songsPlayedIDs: new Set(),
    };

    // Bind functions to this
    this.setState = this.setState.bind(this);
    this.recordNextSongsLength = this.recordNextSongsLength.bind(this);
    this.playSong = this.playSong.bind(this);
    this.pauseSong = this.pauseSong.bind(this);
    this.incrementTimer = this.incrementTimer.bind(this);
    this.startTimer = this.startTimer.bind(this);
    this.stopTimer = this.stopTimer.bind(this);
    this.playNextFromQueue = this.playNextFromQueue.bind(this);
    this.backgroundGetThreeSongs = this.backgroundGetThreeSongs.bind(this);
    this.handleSliderChange = this.handleSliderChange.bind(this);

    // Save some example images for user comments
    this.userImages = [
      'url(https://i1.sndcdn.com/avatars-000695845801-jyfa5g-t50x50.jpg)',
      'url(https://i1.sndcdn.com/avatars-000274853469-3mk2s7-t50x50.jpg)',
      'url(https://i1.sndcdn.com/avatars-000469956462-p8hr59-t50x50.jpg)',
      'url(https://i1.sndcdn.com/avatars-000228186996-vcp1u4-t50x50.jpg)',
      'url(https://i1.sndcdn.com/avatars-000286698547-9rrb5v-t50x50.jpg)',
      'url(https://i1.sndcdn.com/avatars-000310841632-oqxf4c-t50x50.jpg)',
      'url(https://i1.sndcdn.com/avatars-000271547302-69b2fg-t50x50.jpg)',
    ];
  }

  // On mount, get some songs from S3; set interval to get more songs
  componentDidMount() {
    // Get song id from url
    this.getSong();
    // Set listener to get more songs if user has fewer than two songs enqueued
    setInterval(() => {
      if (this.state.songQueueAudio.length < 2) {
        console.log('loading more songs!');
        this.backgroundGetThreeSongs();
      }
    }, 10000);
  }

  // Get specific song for loaded page
  getSong() {
    // Get song id from url
    const splits = document.URL.split('/');
    const song_id = splits[splits.length - 2];
    axios
      .get(`http://localhost:5001/query/getSong/${song_id}`)
      .then((response) => {
        const songObj = response.data[0];
        songObj.comments = response.data[1];
        // Parse waveform data, calculate relative date posted
        songObj.waveform_data = JSON.parse(songObj.waveform_data);
        songObj.date_posted = calculateDatePosted(songObj.upload_time);
        const songAudio = new Audio(songObj.song_data_url);
        // Set to state then do the same for the rest of the songs
        this.setState(
          {
            currentSongObj: songObj,
            currentSongAudio: songAudio,
          },
          () => {
            console.log(this.state.currentSongObj);
            // Draw waveform playback chart when sonds metadata is loaded
            this.state.currentSongAudio.addEventListener(
              'loadedmetadata',
              () => {
                // Calculate total length as string MM:SS
                const currentSongObj = this.state.currentSongObj;
                currentSongObj.durationMMSS = calculateMMSS(
                  this.state.currentSongAudio.duration
                );
                this.setState({currentSongObj});
              }
            );
          }
        );
      })
      .catch((err) => {
        console.log(err);
      });
  }

  // Get one song loaded from AWS
  backgroundGetThreeSongs() {
    axios
      .get('http://localhost:5001/query/three-songs')
      .then((response) => {
        const songObjs = response.data;
        // Create Audio object for remaining songs
        const remainingSongsAudio = [];
        const remainingSongsObjs = [];
        for (let i = 0; i < songObjs.length; i++) {
          // Only process, enqueue songs not yet played
          if (!this.state.songsPlayedIDs.has(songObjs.song_id)) {
            // Parse waveform data, calculate relative date posted
            songObjs[i].waveform_data = JSON.parse(songObjs[i].waveform_data);
            songObjs[i].date_posted = calculateDatePosted(
              songObjs[i].upload_time
            );
            remainingSongsAudio.push(new Audio(songObjs[i].song_data_url));
            remainingSongsObjs.push(songObjs[i]);
          }
        }
        // Set state with new audio objects, song objects
        this.setState({
          songQueueAudio: remainingSongsAudio,
          songQueueObjects: remainingSongsObjs,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  // Remove song from Audio and Obj queues; set to current song in state
  playNextFromQueue() {
    // If queue has songs, get the next one
    if (this.state.songQueueAudio.length) {
      const {songQueueAudio, songQueueObjects} = this.state;
      const songAudio = songQueueAudio.pop();
      const songObj = songQueueObjects.pop();
      // Set current playback time to 0
      songObj.currentTime = 0;
      songObj.currentTimeMMSS = calculateMMSS(songObj.currentTime);
      songObj.durationMMSS = calculateMMSS(songAudio.duration);
      songObj.waveform_data = JSON.parse(songObj.waveform_data);
      // Stop current song's playback
      this.pauseSong();
      this.setState(
        {
          currentSongAudio: songAudio,
          songQueueAudio: songQueueAudio,
          songQueueObjects: songQueueObjects,
          timerIntervalID: null,
          currentSongObj: songObj,
        },
        () => {
          // Start current song's playback
          this.playSong();
        }
      );
    } else {
      this.initialGetThreeSongs();
    }
  }

  // Calculate a song's length in format MM:SS; save in state
  recordNextSongsLength(songAudio) {
    // Iteratively reduce durationRemaining to create time string
    let durationRemaining = Math.floor(songAudio.duration);
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
      if (durationRemaining < 10) {
        // If sinlgle-digit, pad-
        length += JSON.stringify(durationRemaining).padStart(2, '0');
      } else {
        length += `${durationRemaining}`;
      }
    }
    // Save to state
    this.setState((state) => {
      const {currentSongObj} = state;
      currentSongObj.lengthString = length;
      return {
        currentSongObj,
      };
    });
  }

  // Start song playback if a song is selected
  playSong() {
    if (this.state.currentSongAudio) {
      console.log(this.state.currentSongObj);
      console.log('playing song: ', this.state.currentSongAudio);
      // Change play button to pause button
      this.setState({playButtonState: 'pause'}, () => {
        this.state.currentSongAudio.play();
        // Listen for song to finish
        this.state.currentSongAudio.addEventListener('ended', () => {
          // Start next song
          this.playNextFromQueue();
        });
        // Start song timer
        this.startTimer();
        // Record song as having been played
        this.setState((state) => {
          return {
            songsPlayedIDs: state.songsPlayedIDs.add(
              state.currentSongObj.song_id
            ),
          };
        });
      });
    }
  }

  // Pause song playback if a song is selected
  pauseSong() {
    if (this.state.currentSongAudio) {
      // Change play button to pause button
      this.setState({playButtonState: 'play'});
      this.state.currentSongAudio.pause();
      // Stop song timer
      this.stopTimer();
    }
  }

  // Increment the current song's timer every second
  incrementTimer() {
    const currentTime = this.state.currentSongAudio.currentTime;
    const currentSongObj = this.state.currentSongObj;
    currentSongObj.currentTime = Math.floor(currentTime + 1);
    currentSongObj.currentTimeMMSS = calculateMMSS(currentSongObj.currentTime);
    this.setState({currentSongObj});
  }

  // Start playback timer for current song; save interval's ID in state
  startTimer() {
    // Update timer every second
    const timerIntervalID = setInterval(this.incrementTimer, 250);
    // Record id of interval
    this.setState({
      timerIntervalID,
    });
  }

  // Stop the timer for current song playback; use timer interval ID in state
  stopTimer() {
    // Get ID of timer currently running
    const ID = this.state.timerIntervalID;
    // Clear interval with id
    clearInterval(ID);
  }

  // Toggle current place in song using the slider
  handleSliderChange(event) {
    // Save currentTime in object
    const newSongObj = this.state.currentSongObj;
    newSongObj.currentTime = event.target.value;
    // Save currentTime in audio object as well
    const newSongAudio = this.state.currentSongAudio;
    newSongAudio.currentTime = event.target.value;
    // Persis in state
    this.setState({
      test: event.target.value,
      currentSongObj: newSongObj,
      currentSongAudio: newSongAudio,
    });
  }

  // Render App component
  render() {
    const {playButtonState, songPlayerPixelWidth} = this.state;
    const {
      currentTime,
      currentTimeMMSS,
      durationMMSS,
      artist_name,
      song_name,
      date_posted,
      tag,
      song_art_url,
    } = this.state.currentSongObj;
    const comments = this.state.currentSongObj.comments
      ? this.state.currentSongObj.comments
      : [];
    const currentSongAudio = this.state.currentSongAudio || 60;
    const currentSongObj = this.state.currentSongObj || {};
    const length = currentSongAudio.duration || 60;
    return (
      <div>
        <div className='nav-bar'></div>
        {/* <button id='next-song-btn' onClick={this.playNextFromQueue}>
          Next Song
        </button> */}
        <div id='playbackCenter' className='outer-player-panel'>
          <div
            className='inner-player-panel'
            style={{
              background: `linear-gradient(
                135deg,
                rgb${this.state.currentSongObj.background_light} 0%,
                rgb${this.state.currentSongObj.background_dark} 100%`,
            }}
          >
            <div className='player-head'>
              <div
                className='play-button-wrapper button'
                onClick={() => {
                  if (playButtonState === 'play') {
                    this.playSong();
                  } else {
                    this.pauseSong();
                  }
                }}
              >
                <div className={playButtonState + '-button button'}></div>
              </div>
              <div className='artist-name-container'>
                <span className='artist-name fit-width-to-contents'>
                  {artist_name}
                </span>
              </div>
              <div className='song-name-container'>
                <span className='song-name fit-width-to-contents'>
                  {song_name}
                </span>
              </div>
              <div className='date-posted-container'>
                <div className='date-posted'>{date_posted}</div>
              </div>
              <div className='tags-container'>
                <div className='tags fit-width-to-contents'>{tag}</div>
              </div>
            </div>
            <div className='album-art'>
              <img src={song_art_url} alt='' className='album-art' />
            </div>
            <SongPlayer
              currentTime={currentTime}
              currentTimeMMSS={currentTimeMMSS}
              durationMMSS={durationMMSS}
              songPlayerPixelWidth={songPlayerPixelWidth}
              currentSongAudio={currentSongAudio}
              currentSongObj={currentSongObj}
              userImages={this.userImages}
              comments={comments}
              handleSliderChange={this.handleSliderChange}
              divElement={this.divElement}
            />
            {/* <div className='song-player'>
              <div className='current-playback-timer-container'>
                <div className='current-playback-timer fit-width-to-contents'>
                  {currentTimeMMSS}
                </div>
              </div>
              <div className='total-song-length-container'>
                <div className='total-song-length'>{durationMMSS}</div>
              </div>
              <div
                className='waveform-container'
                ref={(divElement) => (this.divElement = divElement)}
              >
                <canvas
                  id='playback-chart'
                  ref='canvas'
                  className='waveform'
                ></canvas>
                <div className='user-comment-container'>
                  {comments.map((comment) => {
                    return (
                      <div
                        className='user-image'
                        style={{
                          left:
                            this.state.songPlayerPixelWidth *
                            (comment.time_stamp /
                              this.state.currentSongAudio.duration),
                          backgroundImage: this.userImages[
                            comment.time_stamp % this.userImages.length
                          ],
                        }}
                      ></div>
                    );
                  })}
                </div>
              </div>
              <div className='playback-slider-container'>
                <input
                  type='range'
                  min='0'
                  max={length}
                  value={currentTime}
                  onChange={this.handleSliderChange}
                  className='playback-slider'
                  style={{
                    background: `linear-gradient(
                      90deg, 
                      #f50 ${(this.state.currentSongAudio.currentTime /
                        this.state.currentSongAudio.duration) *
                        100}%, 
                      #999999 0%)`,
                  }}
                />
              </div>
              <div className='expanded-comments-container'>
                <div className='expanded-comment'></div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    );
  }
}
