import React from "react"

export function Loader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] w-full gap-4">
      <div className="loader"></div>
      <p className="text-muted-foreground animate-pulse">Cargando información...</p>
      <style jsx>{`
        .loader {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: inline-block;
          border-top: 4px solid var(--primary);
          border-right: 4px solid transparent;
          box-sizing: border-box;
          animation: rotation 1s linear infinite;
        }
        .loader::after {
          content: '';  
          box-sizing: border-box;
          position: absolute;
          left: 0;
          top: 0;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border-left: 4px solid var(--accent);
          border-bottom: 4px solid transparent;
          animation: rotation 0.5s linear infinite reverse;
        }
        @keyframes rotation {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
