// src/components/VideoCard.jsx
import React, { useEffect, useRef, useState } from "react";
import YouTube from "react-youtube";
import { getAuth } from "firebase/auth";
import { getUserProgress, saveVideoProgress } from "../lib/userProgress";

export default function VideoCard({ title, videoId }) {
  const playerRef = useRef(null);
  const pollRef = useRef(null);
  const [completed, setCompleted] = useState(false);
  const [pct, setPct] = useState(0);
  const auth = getAuth();
  const user = auth.currentUser;

  // load saved progress for this user/video
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user) return;
      try {
        const progress = await getUserProgress(user.uid);
        const v = progress[videoId];
        if (v && mounted) {
          setCompleted(!!v.completed);
          setPct(v.pct || 0);
        }
      } catch (err) {
        console.warn("load progress error", err);
      }
    }
    load();
    return () => (mounted = false);
  }, [user, videoId]);

  // when player ready, store ref and start polling
  const onReady = (event) => {
    playerRef.current = event.target;

    // clear previous poll (safe)
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      try {
        const player = playerRef.current;
        if (!player || typeof player.getDuration !== "function") return;
        const duration = player.getDuration();
        const current = player.getCurrentTime();
        if (!duration || duration === 0) return;
        const percent = (current / duration) * 100;
        setPct(Math.round(percent));

        // when crossing threshold, persist and mark completed
        if (percent >= 80 && !completed) {
          setCompleted(true); // optimistic update
          if (user) {
            try {
              await saveVideoProgress(user.uid, videoId, percent);
            } catch (err) {
              console.error("save progress failed", err);
            }
          }
        }
      } catch (err) {
        // ignore polling errors silently
      }
    }, 1000);
  };

  // detect ended event (optional backup)
  const onStateChange = (event) => {
    // YT state 0 = ended
    if (event.data === 0 && !completed) {
      setCompleted(true);
      if (user) saveVideoProgress(user.uid, videoId, 100);
    }
  };

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
      <div className="relative pb-[60%] h-0">
        <YouTube
          videoId={videoId}
          onReady={onReady}
          onStateChange={onStateChange}
          opts={{
            width: "100%",
            height: "100%",
            playerVars: { rel: 0, modestbranding: 1, controls: 1 },
          }}
          className="absolute top-0 left-0 w-full h-full"
        />
      </div>

      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
        <div className="flex items-center justify-between mt-4">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={completed}
              readOnly
              className="form-checkbox h-5 w-5 text-indigo-600 rounded-md"
            />
            <span className="text-sm font-medium text-gray-700">
              {completed ? "Completed" : `Watched ${pct}%`}
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
