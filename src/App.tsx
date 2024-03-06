import {useQuery} from "@tanstack/react-query";
import {useEffect, useState} from "react";
// eslint-disable-next-line
// @ts-ignore
import mqtt from "mqtt/dist/mqtt.esm";

const fetchSysInfo = async () => {
  const url = 'https://status.lilhuy-services.uk/'
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  if (!response.ok) throw new Error('Failed to fetch system info')
  return await response.json()
}

function App() {
  const {data = {}} = useQuery({
    queryKey: ['system-info'],
    queryFn: fetchSysInfo,

  })
  const [systemInfo, setSystemInfo] = useState({
    cpuLoad: 0,
    diskUsage: 0,
    memoryUsage: 0,
    cpuTemperature: 0
  })

  useEffect(() => {
    const client = mqtt.connect('wss://mqtt-wss.lilhuy-services.uk/mqtt');
    const topic = '/system-info'

    client.on("connect", () => {
      console.log("Connected to EMQ server");
      // Subscribe to topics or perform other actions here
      client.subscribe(topic);
    });
    client.on("error", (error: Error) => {
      console.error("MQTT Error:", error);
    });

    client.on("close", () => {
      console.log("Connection to EMQ server closed");
    });

    client.on("message", (receivedTopic: any, message: any) => {
      console.log(
        `Received message on topic ${receivedTopic}: ${message.toString()}`
      );
      setSystemInfo(JSON.parse(message.toString()))
    });
    return () => {
      client.end()
    }
  }, []);
  return (
    <div className='main'>
      <div id="info">
        <h1>Lilhuy Server Monitor</h1>
        <p>CPU Usage: {systemInfo?.cpuLoad ?? 'Loading...'}%</p>
        <p>Disk Usage: {systemInfo?.diskUsage ?? 'Loading...'}%</p>
        <p>Memory Usage: {systemInfo?.memoryUsage ?? 'Loading...'}%</p>
        <p>CPU Temperature: {systemInfo?.cpuTemperature ?? 'Loading...'}°C</p>
        <p>Total Pods Running in k8s: {data?.totalPods ?? 'loading...'} (not includes systems pods)</p>
      </div>
    </div>
  )
}

export default App
