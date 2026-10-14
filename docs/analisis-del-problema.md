# Análisis del problema — GastoClaroTFI

*Documento de respaldo del README. Se ampliará en los informes de avance y en el Informe Final del TFI.*

## El problema que queremos resolver

Antes de diseñar la aplicación analizamos la situación económica de los hogares argentinos. Los datos muestran un problema concreto y actual:

**📉 Cada vez más familias no pueden pagar lo que deben**
> *"El indicador de mora de las financiaciones a las familias totalizó **12,9 %** en el mes."* — BCRA, Informe sobre Bancos, julio de 2026

- Es el nivel más alto en unos **20 años**; en mayo de 2025 rondaba el 4,5 %.
- La mora llega al **13,1 %** en tarjetas de crédito y al **15,9 %** en préstamos personales (mayo 2026).
- De 20,5 millones de personas con un crédito vigente, **6,3 millones están atrasadas** en sus pagos.

**💸 Los ingresos quedaron atrás**
- Tras una inflación de **211,4 %** en 2023 y **117,8 %** en 2024 *(INDEC)*, entre 2017 y 2025 el salario privado registrado perdió un **20 %** de poder de compra y el público, un **34 %**.
- En 2026 los salarios registrados siguen por debajo de la inflación: **+12,3 %** contra **+14,7 %** entre enero y mayo.
- La pobreza alcanzó al **32,3 %** de las personas y la indigencia al **7,5 %** en el primer semestre de 2026, ambas en aumento respecto del semestre anterior *(INDEC)*.

**🔍 La inflación de cada persona no es la del promedio**
- El IPC mide una canasta promedio. Con la canasta oficial (2004-05), la inflación acumulada entre noviembre de 2023 y enero de 2026 fue de **317 %**; con una canasta actualizada (2017-18), de **466 %**. Según en qué gaste cada uno, el aumento real que vive puede ser muy distinto.

### Por qué las herramientas actuales no alcanzan

Las planillas de cálculo se abandonan porque cargarlas lleva tiempo, y las aplicaciones de finanzas disponibles están pensadas para otros mercados: **no ajustan por inflación**, no muestran cuánto subió lo que cada uno compra y no reflejan el **costo real de financiarse con tarjeta**.

### Nuestra respuesta

Cuando el sueldo queda quieto y los precios del día a día siguen subiendo, quien no registra sus gastos **cree que vive como antes**, y lo descubre cuando ya no llega a fin de mes. GastoClaro busca **anticiparse a ese momento**:

- 📝 **Presupuesto real, ítem por ítem**: cantidad y precio estimado, comparado mes a mes con lo que realmente se gastó.
- 📊 **Inflación personal**: cuánto subieron los productos que compra cada usuario, frente al IPC.
- 🔔 **Alertas antes de pasarse** del presupuesto, no después.
- 💳 **Costo real de la tarjeta**: cuotas, mantenimiento e intereses al financiar el resumen.
- 🐜 **Gastos hormiga y metas de ahorro**, para recuperar margen y planificar.

**No buscamos ser una app de gastos más, sino una herramienta de prevención:** que cada persona ordene sus finanzas y tome conciencia real de su consumo **antes** de tener que endeudarse.

<sub>Fuentes: [INDEC – Pobreza e indigencia, 1.er semestre 2026](https://www.infobae.com/economia/2026/09/24/la-pobreza-subio-al-323-en-el-primer-semestre-de-ano-y-afecto-a-155-millones-de-personas/) · [BCRA – Informe sobre Bancos, julio 2026](https://www.bcra.gob.ar/archivos/Pdfs/PublicacionesEstadisticas/informes/informe-bancos-2026-07.pdf) · [elDiarioAR, 09/2026](https://www.eldiarioar.com/economia/mora-familias-bancos-llego-12-9-julio-nivel-alto-ano_1_13522368.html) · [iProfesional, 24/07/2026](https://www.iprofesional.com/finanzas/460748-la-morosidad-de-las-familias-volvio-a-crecer-y-se-triplico-en-el-ultimo-ano) · [Infobae, 24/04/2026](https://www.infobae.com/economia/2026/04/24/empeoran-los-problemas-de-endeudamiento-de-las-familias-la-morosidad-casi-se-cuadruplico-en-un-ano-y-es-la-mas-alta-en-dos-decadas/) · [Infobae, 23/02/2026](https://www.infobae.com/economia/2026/02/23/cuanto-poder-adquisitivo-perdieron-los-salarios-en-los-ultimos-ocho-anos-por-efecto-de-la-inflacion/) · [iProfesional, 21/07/2026](https://www.iprofesional.com/management/460429-los-salarios-del-empleo-registrado-volvieron-a-perder-contra-la-inflacion-oficial) · [El Economista, 02/03/2026](https://eleconomista.com.ar/economia/polemica-medicion-indec-cual-inflacion-real-acumulada-2023-2026-n93029) · [BBC Mundo, 2023](https://www.bbc.com/mundo/noticias-america-latina-65553390)</sub>
