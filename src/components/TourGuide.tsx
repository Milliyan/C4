import { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

const TourGuide = () => {
  const [run, setRun] = useState(false);

  // Define your steps here
  const steps: Step[] = [
    {
      target: 'body',
      content: <h2 className="font-bold text-lg">Welcome to Circuit Studio! ⚡</h2>,
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.tour-sidebar',
      content: '1. Drag and drop components from here onto the grid.',
    },
    {
      target: '.tour-canvas',
      content: '2. Connect components by dragging a line from one handle (dot) to another.',
    },
    {
      target: '.tour-canvas', // Points to the canvas again
      content: (
        <div>
          <strong className="block mb-2">Need a Junction?</strong>
          <p>
            To connect 3 or more wires (Parallel connection), 
            <strong> double-click</strong> on an existing wire to create a <strong>Junction Dot</strong>.
          </p>
        </div>
      ),
    },
    {
      target: '.tour-calculate',
      content: '3. Finally, select your analysis method and click Calculate.',
    },
  ];

  useEffect(() => {
    // Check if user has already seen the tour
    const tourSeen = localStorage.getItem('tourSeen_v2');
    if (!tourSeen) {
      setRun(true);
    }
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('tourSeen_v2', 'true');
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      styles={{
        options: {
          primaryColor: '#2563eb', // Blue-600 to match your theme
          zIndex: 10000,
        },
        buttonNext: {
            backgroundColor: '#2563eb',
        },
        tooltipContainer: {
            textAlign: 'left'
        }
      }}
      callback={handleJoyrideCallback}
    />
  );
};

export default TourGuide;