import pandas as pd
from flask import Flask, request, jsonify

app = Flask(__name__)
dataframe = None

def load_data():
    global dataframe
    try:
        print("Iniciando o carregamento dos dados...")

        dataframe = pd.read_csv('vendas_ficticias.csv', encoding='utf-8', dtype={
            'loja_id': 'string',
            'departamento': 'string',
            'marca': 'string',
            'cod_produto': 'string'
        })

        dataframe['data_dt'] = pd.to_datetime(dataframe['data'])
        dataframe['lucro'] = dataframe['valor_venda_liquida'] - (
                    dataframe['custo_produto_unitario'] * dataframe['quantidade_vendida'])
        dataframe['ano'] = dataframe['data_dt'].dt.year
        dataframe['mes'] = dataframe['data_dt'].dt.month

        print(f"Dados carregados com sucesso. Shape: {dataframe.shape}")

    except FileNotFoundError:
        print("Erro: Arquivo 'vendas_ficticias.csv' não encontrado.")
        exit(1)
    except Exception as e:
        print(f"Erro inesperado ao carregar os dados: {e}")
        exit(1)


def aplicar_filtros(df, filtros):
    df_filtrado = df.copy()

    if filtros:
        for coluna, valor in filtros.items():
            if coluna in df_filtrado.columns:
                # Usa .astype(str) para garantir que a comparação funcione (ex: '01' == '01')
                if df_filtrado[coluna].dtype == 'object' or df_filtrado[coluna].dtype == 'string':
                    df_filtrado = df_filtrado[df_filtrado[coluna].str.lower() == str(valor).lower()]
                else:
                    # Filtro para colunas numéricas (mes, ano)
                    df_filtrado = df_filtrado[df_filtrado[coluna] == valor]
            else:
                print(f"Aviso: Coluna de filtro '{coluna}' não encontrada.")

    return df_filtrado


#  As Rotas da API

@app.route('/')
def health_check():
    return jsonify({
        "status": "online",
        "message": "API do Cérebro de Dados (Python/Pandas) está rodando."
    })


@app.route('/query', methods=['POST'])
def handle_query():

    try:
        data = request.get_json()
        if not data:
            raise ValueError("JSON inválido.")

        funcao = data.get('funcao')
        filtros = data.get('filtros', {})
        dimensao = data.get('dimensao')

        print(f"[API Python] Recebido: funcao={funcao}, filtros={filtros}")

        df_filtrado = aplicar_filtros(dataframe, filtros)
        if df_filtrado.empty:
            print("[API Python] Aviso: Nenhum dado encontrado para os filtros.")
            resultado = {"metrica": "Nada Encontrado", "filtros_usados": filtros}
            return jsonify({"status": "sucesso_vazio", "resultado": resultado})

        resultado = {}

        if funcao == 'getTotalFaturamento':
            valor = df_filtrado['valor_venda_liquida'].sum()

            if valor == 0:
                print("[API Python] Aviso: O resultado da soma foi 0.0")
                resultado = {"metrica": "Faturamento Total", "valor": 0.0, "filtros_usados": filtros}
                return jsonify({"status": "sucesso_zero", "resultado": resultado})

            resultado = {"metrica": "Faturamento Total", "valor": round(valor, 2)}

        elif funcao == 'getTotalLucro':
            valor = df_filtrado['lucro'].sum()

            if valor == 0:
                print("[API Python] Aviso: O resultado da soma foi 0.0")
                resultado = {"metrica": "Lucro Total", "valor": 0.0, "filtros_usados": filtros}
                return jsonify({"status": "sucesso_zero", "resultado": resultado})

            resultado = {"metrica": "Lucro Total", "valor": round(valor, 2)}

        elif funcao == 'getVendasAgrupadas':
            if not dimensao or dimensao not in dataframe.columns:
                raise ValueError(f"Dimensão '{dimensao}' inválida ou não fornecida.")

            df_agrupado = df_filtrado.groupby(dimensao)[['valor_venda_liquida', 'lucro']].sum().reset_index()

            df_agrupado['valor_venda_liquida'] = df_agrupado['valor_venda_liquida'].round(2)
            df_agrupado['lucro'] = df_agrupado['lucro'].round(2)

            dados_json = df_agrupado.to_dict('records')
            resultado = {"metrica": f"Vendas por {dimensao}", "dados": dados_json}

        else:
            raise ValueError(f"Função '{funcao}' não reconhecida.")

        return jsonify({"status": "sucesso", "resultado": resultado})

    except Exception as e:
        print(f"[API Python] Erro: {e}")
        return jsonify({"status": "erro", "message": str(e)}), 400


# --- 4. Inicialização ---
if __name__ == '__main__':
    load_data()
    print("Iniciando servidor Flask em http://127.0.0.1:5000")
    app.run(port=5000, debug=True)