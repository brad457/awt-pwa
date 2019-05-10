import React, { useEffect, useContext, Fragment } from 'react';
import { HashRouter as Router, Route } from 'react-router-dom';
import { Store } from './Store';
import './App.css';
import Nav from './components/Nav';
import MediaBrowser from './routes/MediaBrowser';
import DownloadManager from './routes/DownloadManager';
import MediaPlayer from './routes/MediaPlayer';

const routes = [
  {
    exact: true,
    key: 'media',
    label: 'Media',
    path: '/media',
  },
  {
    exact: true,
    key: 'downloads',
    label: 'Downloads',
    path: '/downloads',
  },
];

const App = () => { 
  const { state, dispatch } = useContext(Store);

  const init = async () => {
    // fetch video data
    const data = await fetch('/data/videos.json');
    const dataJSON = await data.json();

    // init shaka
    const shaka = window.shaka;
    shaka.polyfill.installAll();

    // initialize shaka storage
    window.storage = new shaka.offline.Storage();
    // make shaka dispatch progress events so that we can have a progress bar when downloading
    // this will probably no longer be necessary in the next version of shaka
    const progressCallback = (content, progress) => {
      dispatch({
        type: 'DOWNLOAD_PROGRESS',
        content,
        progress, 
      });
    };
    window.storage.configure({ progressCallback });

    // start interval that updates the state every second
    // this is a dirty hack and I hope shaka will provide
    // better tools in the future
    setInterval(() => {
      dispatch({
        type: 'SET_IS_DOWNLOAD_IN_PROGRESS',
        value: window.storage.getStoreInProgress(),
      });
    }, 1000);

    return dispatch({
      type: 'INIT_DONE',
      videos: dataJSON,
      isInit: true,
      isSupported: shaka.Player.isBrowserSupported() && shaka.offline.Storage.support(),
    });
  };

  useEffect(() => {
    !state.isInit && init();
  });

  console.log(state);

  const { isInit, isSupported } = state;

  if (!isInit) return <p>loading...</p>;

  return (
    <Router onUpdate={() => window.scrollTo(0, 0)}>
      <div className="App">
        <Nav routes={routes} />
        <main className="container">
          {!isSupported ? (
            <div className="alert alert-danger" role="alert">
              <h4 className="alert-heading">Browser not supported!</h4>
              <hr />
              Unfortunately your browser does not support all required technologies.
            </div>
          ) : (
            <Fragment>
              <Route
                component={MediaBrowser}
                exact
                path="/media"
              />
              <Route
                component={DownloadManager}
                exact
                path="/downloads"
              />
              <Route
                component={MediaPlayer}
                exact
                path="/:mode(stream|offline)/:id"
              />
            </Fragment>
          )}
        </main>
      </div>
    </Router>
  );
}

export default App;
