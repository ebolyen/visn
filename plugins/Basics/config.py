from visn.core.plugin import Plugin, ChartHandler
from visn.core.data import Standard

Plugin(
    name="Basics"
    js_directory="js",
    data_models=[

    ]
    charts=[
        ChartHandler(js="visn.Charts.Area",
                     data_model=Standard
                     ),
        ChartHandler(js="visn.Charts.Bar",
                     data_model=Standard
                     ),
        ChartHandler(js="visn.Charts.Legend",
                     data_model=Standard
                     ),
        ChartHandler(js="visn.Charts.Pie",
                     data_model=Standard
                     )
    ]
)
