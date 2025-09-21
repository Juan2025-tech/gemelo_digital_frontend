import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.jsx'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Heart, Thermometer, Wifi, Battery, AlertTriangle, CheckCircle } from 'lucide-react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001"


function App() {
  const [data, setData] = useState([])
  const [latestData, setLatestData] = useState(null)
  const [anomalies, setAnomalies] = useState([])
  const [deviceStatus, setDeviceStatus] = useState(null)
  const [loading, setLoading] = useState(true)

    const fetchData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/iot/data/latest`)
      const result = await response.json()
      if (result.success) {
        setLatestData(result.data)
        console.log("Latest data updated:", result.data);
        setData(prevData => {
          const newData = JSON.parse(JSON.stringify([...prevData, result.data]))
          return newData.slice(-50) // Mantener solo los últimos 50 puntos
        })
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  const fetchAnomalies = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/iot/anomalies`)
      const result = await response.json()
      if (result.success) {
        setAnomalies(result.anomalies.slice(-10)) // Mostrar solo las últimas 10 anomalías
        console.log("Anomalies updated:", result.anomalies);
      }
    } catch (error) {
      console.error("Error fetching anomalies:", error)
    }
  }

  const fetchDeviceStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/iot/status`)
      const result = await response.json()
      if (result.success) {
        setDeviceStatus(result.device_status)
      }
    } catch (error) {
      console.error("Error fetching device status:", error)
    }
  }

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      // Cargar el historial completo una vez al inicio
      try {
        const response = await fetch(`${API_BASE_URL}/api/iot/data`)
        const result = await response.json()
        if (result.success) {
          setData(result.data.slice(-50))
        }
      } catch (error) {
        console.error("Error fetching initial data:", error)
      }
      await Promise.all([
        fetchData(), // Esto ya obtiene el último y lo añade al historial
        fetchAnomalies(),
        fetchDeviceStatus()
      ])
      setLoading(false)
    }

    loadInitialData()
    
    // Actualizar datos cada 5 segundos
    const interval = setInterval(() => {
      fetchData()
      fetchAnomalies()
      fetchDeviceStatus()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const formatChartData = (data) => {
    return data.map((item, index) => ({
      index: index + 1,
      temperatura: item.temperatura_celsius,
      frecuencia_cardiaca: item.frecuencia_cardiaca_lpm,
      timestamp: new Date(item.timestamp).toLocaleTimeString()
    }))
  }

  const getTemperatureStatus = (temp) => {
    if (temp < 37.5) return { status: 'Hipotermia', color: 'bg-blue-500' }
    if (temp > 39.2) return { status: 'Fiebre', color: 'bg-red-500' }
    return { status: 'Normal', color: 'bg-green-500' }
  }

  const getHeartRateStatus = (hr) => {
    if (hr < 70) return { status: 'Bradicardia', color: 'bg-blue-500' }
    if (hr > 120) return { status: 'Taquicardia', color: 'bg-red-500' }
    return { status: 'Normal', color: 'bg-green-500' }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando gemelo digital...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Gemelo Digital - Monitoreo Animal IoT
          </h1>
          <p className="text-gray-600">
            Monitoreo en tiempo real de temperatura corporal y frecuencia cardíaca
          </p>
        </div>

        {/* Estado del Dispositivo */}
        {deviceStatus && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Estado del Dispositivo IoT
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  {deviceStatus.online ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )}
                  <span className={deviceStatus.online ? 'text-green-600' : 'text-red-600'}>
                    {deviceStatus.online ? 'En línea' : 'Desconectado'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Battery className="h-5 w-5" />
                  <span>Batería: {deviceStatus.battery_level}%</span>
                </div>
                <div>
                  <span>Señal: {deviceStatus.signal_strength}</span>
                </div>
                <div>
                  <span>ID: {deviceStatus.device_id}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Datos Actuales */}
        {latestData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5 text-red-500" />
                  Temperatura Corporal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {latestData.temperatura_celsius}°C
                </div>
                <Badge className={getTemperatureStatus(latestData.temperatura_celsius).color}>
                  {getTemperatureStatus(latestData.temperatura_celsius).status}
                </Badge>
                <p className="text-sm text-gray-500 mt-2">
                  Rango normal: 37.5°C - 39.2°C
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Frecuencia Cardíaca
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {latestData.frecuencia_cardiaca_lpm} lpm
                </div>
                <Badge className={getHeartRateStatus(latestData.frecuencia_cardiaca_lpm).color}>
                  {getHeartRateStatus(latestData.frecuencia_cardiaca_lpm).status}
                </Badge>
                <p className="text-sm text-gray-500 mt-2">
                  Rango normal: 70 - 120 lpm
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Temperatura</CardTitle>
              <CardDescription>Últimas 50 lecturas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={formatChartData(data)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="index" />
                  <YAxis domain={[36, 42]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="temperatura" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Temperatura (°C)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Frecuencia Cardíaca</CardTitle>
              <CardDescription>Últimas 50 lecturas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={formatChartData(data)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="index" />
                  <YAxis domain={[50, 200]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="frecuencia_cardiaca" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Frecuencia Cardíaca (lpm)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Alertas y Anomalías */}
        {anomalies.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Alertas y Anomalías Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {anomalies.map((anomaly, index) => (
                  <Alert key={index} className="border-l-4 border-l-yellow-500">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{anomaly.type} - {anomaly.subtype}</AlertTitle>
                    <AlertDescription>
                      Valor: {anomaly.value} | Rango normal: {anomaly.normal_range} | 
                      Tiempo: {new Date(anomaly.timestamp).toLocaleString()}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500">
          <p>Gemelo Digital IoT - Demostración para clientes potenciales</p>
          <p className="text-sm">Datos simulados para fines demostrativos</p>
        </div>
      </div>
    </div>
  )
}

export default App

