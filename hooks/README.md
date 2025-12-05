# Hooks de Modales Personalizados

Este proyecto usa hooks personalizados para reemplazar los mensajes nativos del navegador (`alert`, `confirm`, `prompt`) con modales personalizados y consistentes con el diseño de la aplicación.

## Hooks Disponibles

### 1. `useConfirmDialog` - Confirmación con dos opciones

Hook para mostrar un modal de confirmación con botones "Confirmar" y "Cancelar".

```tsx
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"

function MyComponent() {
  const { confirm, Dialog } = useConfirmDialog()

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: "Eliminar Producto",
      description: "¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
      type: "danger", // "danger" | "warning" | "info" | "success"
    })

    if (confirmed) {
      // Ejecutar acción
      console.log("Producto eliminado")
    }
  }

  return (
    <>
      <button onClick={handleDelete}>Eliminar</button>
      <Dialog />
    </>
  )
}
```

#### Opciones

- `title` (requerido): Título del modal
- `description` (opcional): Descripción o mensaje adicional
- `confirmText` (opcional, default: "Confirmar"): Texto del botón de confirmación
- `cancelText` (opcional, default: "Cancelar"): Texto del botón de cancelación
- `type` (opcional, default: "info"): Tipo de modal
  - `"danger"`: Botón rojo, icono de error
  - `"warning"`: Botón amarillo, icono de advertencia
  - `"info"`: Botón azul, icono de información
  - `"success"`: Botón verde, icono de éxito
- `onConfirm` (opcional): Función a ejecutar al confirmar
- `onCancel` (opcional): Función a ejecutar al cancelar

#### Retorno

El hook retorna una función `confirm` que devuelve una `Promise<boolean>`:
- `true` si el usuario confirmó
- `false` si el usuario canceló

---

### 2. `useAlertDialog` - Alerta con un botón

Hook para mostrar un modal de alerta con un solo botón "Aceptar".

```tsx
import { useAlertDialog } from "@/hooks/use-alert-dialog"

function MyComponent() {
  const { alert, Dialog } = useAlertDialog()

  const handleError = async () => {
    await alert({
      title: "Error",
      description: "No se pudo completar la operación. Por favor, intentá nuevamente.",
      buttonText: "Entendido",
      type: "danger",
    })
  }

  return (
    <>
      <button onClick={handleError}>Mostrar Error</button>
      <Dialog />
    </>
  )
}
```

#### Opciones

- `title` (requerido): Título del modal
- `description` (opcional): Descripción o mensaje adicional
- `buttonText` (opcional, default: "Aceptar"): Texto del botón
- `type` (opcional, default: "info"): Tipo de modal (mismos valores que `useConfirmDialog`)
- `onClose` (opcional): Función a ejecutar al cerrar

#### Retorno

El hook retorna una función `alert` que devuelve una `Promise<void>` que se resuelve cuando el usuario cierra el modal.

---

## Ejemplos de Uso

### Confirmación de Eliminación

```tsx
const handleDeleteProduct = async (product: Product) => {
  const confirmed = await confirm({
    title: "Eliminar Producto",
    description: `¿Estás seguro de eliminar "${product.name}"? Esta acción no se puede deshacer.`,
    confirmText: "Eliminar",
    cancelText: "Cancelar",
    type: "danger",
  })

  if (confirmed) {
    store.deleteProduct(product.id)
    toast.success("Producto eliminado")
  }
}
```

### Validación con Alerta

```tsx
const handleSubmit = async () => {
  if (quantity < 0) {
    await alert({
      title: "Stock Negativo",
      description: "No podés tener stock negativo. Por favor, ajustá la cantidad.",
      type: "warning",
      buttonText: "Entendido",
    })
    return
  }
  // Continuar con la lógica...
}
```

### Confirmación de Acción Destructiva

```tsx
const handleCloseShift = async () => {
  const confirmed = await confirm({
    title: "Cerrar Turno",
    description: "¿Estás seguro de cerrar este turno? No podrás agregar más ventas después.",
    confirmText: "Cerrar Turno",
    cancelText: "Cancelar",
    type: "warning",
  })

  if (confirmed) {
    store.closeShift(shiftId)
    toast.success("Turno cerrado")
  }
}
```

### Mensaje de Éxito

```tsx
const handleSave = async () => {
  // ... lógica de guardado ...
  
  await alert({
    title: "Guardado Exitoso",
    description: "Los cambios se guardaron correctamente.",
    type: "success",
    buttonText: "Perfecto",
  })
}
```

---

## Ventajas sobre Mensajes Nativos

1. **Diseño Consistente**: Los modales siguen el diseño de la aplicación
2. **Mejor UX**: Animaciones suaves y transiciones
3. **Personalizable**: Diferentes tipos y estilos según el contexto
4. **Accesible**: Usa componentes de Radix UI que son accesibles por defecto
5. **Responsive**: Se adapta a diferentes tamaños de pantalla
6. **Type-safe**: TypeScript completo con tipos definidos

---

## Notas Importantes

- **Siempre incluir el componente `<Dialog />`** en el JSX del componente que usa el hook
- Los hooks pueden usarse múltiples veces en el mismo componente (cada uno tiene su propio estado)
- Los modales se cierran automáticamente después de la acción del usuario
- Los hooks manejan el estado de carga automáticamente en `useConfirmDialog`

---

## Migración desde Mensajes Nativos

### Antes (nativo)
```tsx
if (confirm("¿Estás seguro?")) {
  // acción
}
```

### Después (hook)
```tsx
const { confirm, Dialog } = useConfirmDialog()

const handleAction = async () => {
  const confirmed = await confirm({
    title: "Confirmar",
    description: "¿Estás seguro?",
  })
  
  if (confirmed) {
    // acción
  }
}

return <><button onClick={handleAction}>Acción</button><Dialog /></>
```

---

## Archivos Relacionados

- `hooks/use-confirm-dialog.tsx`: Hook para confirmaciones
- `hooks/use-alert-dialog.tsx`: Hook para alertas
- `components/ui/alert-dialog.tsx`: Componente base de Radix UI



