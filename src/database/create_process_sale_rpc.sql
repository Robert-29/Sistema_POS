CREATE OR REPLACE FUNCTION process_sale(
  p_id_negocio UUID,
  p_id_sucursal UUID,
  p_vendedor_id UUID,
  p_id_punto_venta UUID,
  p_total NUMERIC,
  p_metodo_pago TEXT,
  p_items JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_venta_id UUID;
  v_item JSONB;
  v_producto_id UUID;
  v_cantidad NUMERIC;
  v_precio NUMERIC;
  v_tipo_inventario TEXT;
  v_current_stock NUMERIC;
BEGIN
  -- 1. Obtener tipo de inventario
  SELECT tipo_inventario INTO v_tipo_inventario FROM perfiles_negocio WHERE id = p_id_negocio;

  -- 2. Insertar Venta
  INSERT INTO ventas (id_negocio, id_sucursal, id_punto_venta, vendedor_id, total, metodo_pago)
  VALUES (p_id_negocio, p_id_sucursal, p_id_punto_venta, p_vendedor_id, p_total, p_metodo_pago)
  RETURNING id INTO v_venta_id;

  -- 3. Procesar Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_producto_id := (v_item->>'id')::UUID;
    v_cantidad := (v_item->>'cantidad')::NUMERIC;
    v_precio := (v_item->>'precio')::NUMERIC;

    -- Insertar Detalle
    INSERT INTO detalles_ventas (id_venta, id_producto, cantidad, precio_unitario, id_negocio)
    VALUES (v_venta_id, v_producto_id, v_cantidad, v_precio, p_id_negocio);

    -- Actualizar Stock
    IF v_tipo_inventario = 'unico' THEN
      UPDATE productos 
      SET stock = stock - v_cantidad
      WHERE id = v_producto_id;
    ELSE
      -- Stock por sucursal
      UPDATE stock_sucursales
      SET cantidad = cantidad - v_cantidad
      WHERE id_producto = v_producto_id AND id_sucursal = p_id_sucursal;
    END IF;

    -- Log Auditoría (Simplificado, uno por item o podría ser uno por venta afuera)
    INSERT INTO logs_auditoria (id_negocio, id_sucursal, accion, detalles)
    VALUES (p_id_negocio, p_id_sucursal, 'VENTA_POS', 'Venta ID: ' || v_venta_id || ' Prod: ' || v_producto_id || ' Cant: ' || v_cantidad);
    
  END LOOP;

  RETURN jsonb_build_object('success', true, 'venta_id', v_venta_id);
END;
$$;
