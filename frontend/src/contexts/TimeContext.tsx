import React, { createContext, useContext, useState, useEffect } from 'react';

interface TimeContextData {
    currentTime: Date;
    isSimulation: boolean;
    setSimulationMode: (date: Date) => void;
    setLiveMode: () => void;
}

const TimeContext = createContext<TimeContextData>({} as TimeContextData);

export const TimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [simpleTime, setSimpleTime] = useState(new Date());
    const [simulationDate, setSimulationDate] = useState<Date | null>(null);

    // Live Clock Effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (!simulationDate) {
            interval = setInterval(() => {
                setSimpleTime(new Date());
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [simulationDate]);

    const currentTime = simulationDate || simpleTime;
    const isSimulation = !!simulationDate;

    const setSimulationMode = (date: Date) => {
        setSimulationDate(date);
    };

    const setLiveMode = () => {
        setSimulationDate(null);
        setSimpleTime(new Date());
    };

    return (
        <TimeContext.Provider value={{ currentTime, isSimulation, setSimulationMode, setLiveMode }}>
            {children}
        </TimeContext.Provider>
    );
};

export const useTime = () => useContext(TimeContext);
