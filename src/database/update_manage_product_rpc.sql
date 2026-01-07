CREATE OR REPLACE FUNCTION manage_product(
  p_employee_id UUID,
  p_product_data JSONB,
  p_stock_sucursales JSONB DEFAULT NULL,
  p_operation TEXT DEFAULT 'INSERT'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role TEXT;
  v_permisos JSONB;
  v_product_id UUID;
  v_sucursal_entry JSONB;
BEGIN
  -- 1. Check Authorization
  SELECT rol, permisos INTO v_user_role, v_permisos
  FROM usuarios_sucursal
  WHERE id = p_employee_id;

  IF v_user_role IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  -- Backwards compatibility: allow if role is admin/supervisor OR if permission is explicitly granted
  IF v_user_role NOT IN ('admin', 'supervisor', 'gerente') AND (v_permisos->>'can_manage_products')::boolean IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'No tienes permiso para gestionar productos.';
  END IF;

  -- 2. Perform Operation
  IF p_operation = 'INSERT' THEN
    INSERT INTO productos (nombre, precio, stock, codigo_barras, id_negocio)
    VALUES (
      p_product_data->>'nombre',
      (p_product_data->>'precio')::NUMERIC,
      COALESCE((p_product_data->>'stock')::INTEGER, 0),
      p_product_data->>'codigo_barras',
      (p_product_data->>'id_negocio')::UUID
    )
    RETURNING id INTO v_product_id;

    -- Insert stock per branch if provided
    IF p_stock_sucursales IS NOT NULL THEN
      FOR v_sucursal_entry IN SELECT * FROM jsonb_array_elements(p_stock_sucursales)
      LOOP
        INSERT INTO stock_sucursales (id_producto, id_sucursal, id_negocio, cantidad)
        VALUES (
          v_product_id,
          (v_sucursal_entry->>'id_sucursal')::UUID,
          (p_product_data->>'id_negocio')::UUID,
          (v_sucursal_entry->>'cantidad')::INTEGER
        );
      END LOOP;
    END IF;

  ELSIF p_operation = 'UPDATE' THEN
    v_product_id := (p_product_data->>'id')::UUID;
    
    UPDATE productos
    SET
      nombre = p_product_data->>'nombre',
      precio = (p_product_data->>'precio')::NUMERIC,
      stock = COALESCE((p_product_data->>'stock')::INTEGER, stock),
      codigo_barras = p_product_data->>'codigo_barras'
    WHERE id = v_product_id;

    -- Update stock per branch if provided
    IF p_stock_sucursales IS NOT NULL THEN
      FOR v_sucursal_entry IN SELECT * FROM jsonb_array_elements(p_stock_sucursales)
      LOOP
        INSERT INTO stock_sucursales (id_producto, id_sucursal, id_negocio, cantidad)
        VALUES (
          v_product_id,
          (v_sucursal_entry->>'id_sucursal')::UUID,
          (p_product_data->>'id_negocio')::UUID,
          (v_sucursal_entry->>'cantidad')::INTEGER
        )
        ON CONFLICT (id_producto, id_sucursal)
        DO UPDATE SET cantidad = EXCLUDED.cantidad;
      END LOOP;
    END IF;
  END IF;

  RETURN jsonb_build_object('success', true, 'product_id', v_product_id);
END;
$$;
