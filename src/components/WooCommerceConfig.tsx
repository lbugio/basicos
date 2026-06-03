import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { wooCommerceService } from '../services/woocommerce';

interface WooCommerceConfigProps {
  onConfigSave?: () => void;
}

// Credentials are no longer entered in the browser. They live in server-side
// environment variables (WOOCOMMERCE_CONSUMER_KEY / _SECRET) and all WooCommerce
// calls go through the /api/woocommerce proxy, so this panel is now a read-only
// status + setup-instructions view.
export function WooCommerceConfig({ onConfigSave }: WooCommerceConfigProps) {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const configured = wooCommerceService.isConfigured();

  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('idle');
    setErrorMessage('');

    try {
      const isConnected = await wooCommerceService.testConnection();

      if (isConnected) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
        setErrorMessage(
          'No se pudo conectar con WooCommerce. Verifica las variables de entorno del servidor.'
        );
      }
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Error de conexión desconocido');
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Configuración de WooCommerce</CardTitle>
        <CardDescription>
          Las credenciales se configuran de forma segura en el servidor, no en el navegador.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertDescription>
            {configured
              ? 'WooCommerce está habilitado en el servidor. Las peticiones se firman server-side a través del proxy /api/woocommerce.'
              : 'WooCommerce no está habilitado. Define las variables de entorno en el servidor para activar la integración.'}
          </AlertDescription>
        </Alert>

        {connectionStatus === 'success' && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              ¡Conexión exitosa! El servidor se comunica correctamente con tu tienda WooCommerce.
            </AlertDescription>
          </Alert>
        )}

        {connectionStatus === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errorMessage ||
                'Error de conexión. Verifica las variables de entorno del servidor y que la API REST esté habilitada.'}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-4">
          <Button
            onClick={testConnection}
            disabled={isTestingConnection || !configured}
            variant="outline"
          >
            {isTestingConnection ? 'Probando...' : 'Probar Conexión'}
          </Button>

          {onConfigSave && (
            <Button onClick={onConfigSave}>Volver a la Tienda</Button>
          )}
        </div>

        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>Para configurar la conexión (en el servidor):</strong></p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>En WordPress, ve a WooCommerce → Ajustes → Avanzado → API REST</li>
            <li>Crea una clave con permisos de "Lectura/Escritura"</li>
            <li>
              Añade estas variables al archivo <code>.env</code> del servidor:
              <pre className="mt-2 p-3 rounded bg-muted text-xs overflow-x-auto">{`WOOCOMMERCE_STORE_URL=https://mi-tienda.com
WOOCOMMERCE_CONSUMER_KEY=ck_...
WOOCOMMERCE_CONSUMER_SECRET=cs_...
NEXT_PUBLIC_WOOCOMMERCE_STORE_URL=https://mi-tienda.com
NEXT_PUBLIC_WOOCOMMERCE_ENABLED=true`}</pre>
            </li>
            <li>Reinicia el servidor de Next.js</li>
          </ol>
          <p className="mt-4 text-xs">
            <strong>Nota:</strong> El Consumer Key y Secret nunca se envían al navegador.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
