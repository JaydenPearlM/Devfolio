// src/components/AboutJayden.jsx
import React from "react";

export default function AboutJayden() {
  return (
    <section
      id="about"
      className="relative mt-1.5 w-full"
    >
      {/* Wrapper: breathing room */}
      <div className="w-full px-1 sm:px-4 md:px-6">

        {/* 
          TITLE + DONATE BUTTON 
          - mobile: centered (text + button)
          - sm+: layout goes back to row alignment
        */}
        <div
          className="
            mb-3
            flex flex-col
            items-center           /* center content on mobile */
            text-center            /* center text on mobile */
            sm:flex-row
            sm:items-center
            sm:justify-between
            sm:text-left           /* desktop restores left-align */
            gap-3
          "
        >
          <h2 className="text-3xl font-oswald font-bold text-white">
            Welcome to my Developer Portfolio!!!
          </h2>
          </div>

        {/* ABOUT CARD */}
        <div
          className="
            w-full
            lg:max-w-[900px] lg:mx-auto
            rounded-3xl
            shadow-[0_12px_25px_rgba(0,0,0,0.25)]
            hover:shadow-[0_16px_35px_rgba(0,0,0,0.3)]
            transition duration-300
            bg-gradient-to-br from-purple-200 via-blue-300 to-pink-200
            ring-1 ring-blue-300/50
            px-4 sm:px-6 py-6 md:py-8
            relative
            before:content-[''] before:absolute 
            before:inset-[6px] before:rounded-2xl
            before:pointer-events-none 
            before:border 
            before:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]
          "
        >
          <div className="relative z-10 text-gray-900/95 leading-relaxed text-[12px] sm:text-base md:text-lg space-y-4">
            <p>
              Hello, I’m <span className="font-bold text-blue-800">Jayden</span>, 
              a Full-Stack Software Engineer who loves building experiences 
              that work as well as they look. I work across{" "}
              <span className="font-semibold">frontend and backend development</span>, 
              build and integrate <span className="font-semibold">APIs</span>, and handle full{" "}
              <span className="font-semibold">deployment pipelines</span> for both 
              web and desktop applications. My focus is on creating smooth, scalable 
              systems that people enjoy using.
            </p>

            <p>
              My background in <span className="font-semibold">Art & Design</span> gives 
              me a creative edge when it comes to UI and problem solving. 
              I approach code the same way I approach design: with clean structure, 
              good balance, and attention to every little detail. That design mindset 
              helps me bridge aesthetics with performance.
            </p>

            <p>
              <span className="font-semibold">Fun fact:</span> I started out as an 
              Animator but fell in love with Software in 2019. Whether it’s a React 
              interface, an Express API, or a Supabase backend, I’m always chasing 
              that creative spark through code.
            </p>
          </div>

          {/* STACK TEXT */}
          <div className="mt-8 pt-4 border-t border-blue-200">
            <p className="text-center text-sm md:text-base text-blue-950/90 leading-relaxed">
              Python • C++ • SQL • JavaScript • Java <br />
              Mongo/Mongoose • Express.js • React • Node.js • PostgreSQL •
              Software Architecture • Agile Methodologies
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
