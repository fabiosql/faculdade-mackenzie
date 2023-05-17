import { useState, useMemo, useEffect } from "react";
import { Grid, GridItem, Flex, useDisclosure, Select, Text, Tabs, Box, useToast, Button, TabList, Tab, TabPanel, TabPanels, useBreakpointValue } from "@chakra-ui/react";
import { SubmitHandler, useForm } from "react-hook-form";
import Chart from "react-apexcharts";
import { api } from "../../services/api";
import { DataGrid, GridColDef, GridRowModel } from '@material-ui/data-grid';

import regimeJson from "../../services/Forms/regime.json";
import { getFiltroCampus } from "../../utils/getFiltroCampus";
import { getFiltroUnidades } from '../../utils/getFiltroUnidades';
import { getFiltroCursos } from "../../utils/getFiltroCursos";
import { resetLocalStorages } from "../../utils/resetLocalStorages";
import { hasPerm } from "../../utils/hasPerm";
import "./DataGrid/style.css"; // Tell webpack that Button.js uses these styles
import { getAllFuncoes } from "../../utils/getAllFuncoes";
import { GetColumns } from "./DataGrid/GetColumns";
import { GerarAnalise, GerarAnaliseTCC, GerarCargaHorariaTotal, GerarCargaHorariaTotalEnsino, GerarDistribuicao, GerarDocenteTccRegime, GerarDocenteTitulacao, GerarDocenteTitulacaoRegime, GerarDocenteTitulacaoTcc, GerarQtdDocenteComTCC, GerarQtdDocenteSemTCC, GerarSubmissao } from "./Grafico/DataGraficos";
import { ModalRelatorioFiltered } from "./Grafico/ModalRelatorioFiltered";
import { GetRows } from "./DataGrid/GetRows";
import { usePDAContext } from "../../context/useContext";
import { MenuSelectSemestre } from "../Semestres/MenuSelectSemestre";
import TranslatePtBR from "./DataGrid/TranslatePtBR";
import { TipoTitulacao } from "../../services/enums/TipoTitulacao";
import { TipoRegime } from "../../services/enums/TipoRegime";
import CustomToolbar from "./DataGrid/CustomToolbar";
import CustomToolbarVinculo from "./DataGridVinculo/CustomToolbarVinculo";
import { GetColumnsVinculo } from "./DataGridVinculo/GetColumnsVinculo";
import { SUBTAB_GRID, TAB_GRID } from "../../services/enums/Dashboard";
import { ModalLogsGestoresFiltered } from "./Grafico/ModalLogsGestoresFiltered";
import { EstadoAtividade } from "../../services/enums/EstadoAtividade/EstadoAtividade";
import { ModalLogsGestoresEixo } from "./Grafico/ModalLogsGestoresEixo";

interface filtroProps {
    codigoCampus?: number;
    codigoUnidade?: number;
    codigoCurso?: number;
    codigoModalidade?: number;
}

interface ICodigoCursoAnoSemestre {
    curso: string;
}

interface GestorAcoes {
    drt: number;
    acoes: Array<number>,
    codFuncao: number;
}

export function GridColumnDashboard({ role }) {

    resetLocalStorages(["pda.docente.coordenado.ppg", "pda.docente.coordenado"])

    const context = usePDAContext();

    const isPRGA = hasPerm(role, ["COORDENADOR_CGC"]);

    const hasFullPermissao = hasPerm(role, ["ADMIN", "REITOR", "PRO_REITOR_PRPA", "CHEFE_GABINETE","COORDENADOR_PRO_REITORIA"]);
    const showAbaVinculo = hasPerm(role, ["DIRETOR", "COORDENADOR_GRADUACAO", "COORDENADOR_CGC", "PRO_REITOR_PRGA","COMPLIANCE","COORDENADOR_PRO_REITORIA"]);

    const [currentTab, setCurrentTab] = useState<TAB_GRID>(TAB_GRID.GRAFICO)
    const [currentSubTab, setCurrentSubTab] = useState<SUBTAB_GRID>(isPRGA ? SUBTAB_GRID.TCC : SUBTAB_GRID.DOCENTES);

    const [relatorio, setRelatorio] = useState([]);
    const [relatorioPPas, setRelatorioPPAs] = useState([]);

    const [relatorioFiltered, setRelatorioFiltered] = useState([]);
    const [analise, setAnalise] = useState(null);
    const [dimensao, setDimensao] = useState(null);
    const [submissao, setSubmissao] = useState(null);
    const [cargaHorariaTotal, setCargaHorariaTotal] = useState(null);
    const [cargaHorariaTotalEnsino, setCargaHorariaTotalEnsino] = useState(null);

    const [campusFiltered, setCampusFiltered] = useState([]);
    const [unidadesFiltered, setUnidadesFiltered] = useState([]);
    const [cursosFiltered, setCursosFiltered] = useState([]);

    const [filtro, setFiltro] = useState(false);
    const [filtroData, setFiltroData] = useState({
        campus: null,
        unidade: null,
        curso: null,
        modalidade: null,
        regime: null,
        funcao: null
    });

    const [campus, setCampus] = useState([]);
    const [unidades, setUnidades] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [modalidade, setModalidade] = useState([]);

    const [totalHorasJornadasChart, setTotalHorasJornadasChart] = useState(null);
    const [totalHorasEnsinoChart, setTotalHorasEnsinoChart] = useState(null);

    const [analiseChart, setAnaliseChart] = useState(null);
    const [relatorioAnaliseAcima, setRelatorioAnaliseAcima] = useState([]);
    const [relatorioAnaliseNormal, setRelatorioAnaliseNormal] = useState([]);
    const [relatorioAnaliseAbaixo, setRelatorioAnaliseAbaixo] = useState([]);
    const [analiseDataPoint, setAnaliseDataPoint] = useState<number>();

    const [dimensaoChart, setDimensaoChart] = useState(null);
    const [relatorioDimensaoEnsino, setRelatorioDimensaoEnsino] = useState([]);
    const [relatorioDimensaoPesquisa, setRelatorioDimensaoPesquisa] = useState([]);
    const [relatorioDimensaoExtensao, setRelatorioDimensaoExtensao] = useState([]);
    const [relatorioDimensaoGestao, setRelatorioDimensaoGestao] = useState([]);
    const [dimensaoDataPoint, setDimensaoDataPoint] = useState<number>();

    const [submissaoChart, setSubmissaoChart] = useState(null);
    const [submissaoDataPoint, setSubmissaoDataPoint] = useState<number>();

    const [relatorioSubmetidos, setRelatorioSubmetidos] = useState([]);
    const [relatorioNaoSubmetidos, setRelatorioNaoSubmetidos] = useState([]);

    const [relatorioCargaHorariaTotalOcupadas, setRelatorioCargaHorariaTotalOcupadas] = useState([]);
    const [relatorioCargaHorariaTotalOciosas, setRelatorioCargaHorariaTotalOciosas] = useState([]);
    const [cargaHorariaTotalDataPoint, setCargaHorariaTotalDataPoint] = useState<number>();

    const [relatorioCargaHorariaTotalEnsinoOcupadas, setRelatorioCargaHorariaTotalEnsinoOcupadas] = useState([]);
    const [relatorioCargaHorariaTotalEnsinoOciosas, setRelatorioCargaHorariaTotalEnsinoOciosas] = useState([]);
    const [cargaHorariaTotalEnsinoDataPoint, setCargaHorariaTotalEnsinoDataPoint] = useState<number>();

    const [analiseTCC, setAnaliseTCC] = useState(null);
    const [analiseTCCChart, setAnaliseTCCChart] = useState(null);
    const [relatorioAnaliseTCCAcima, setRelatorioAnaliseTCCAcima] = useState([]);
    const [relatorioAnaliseTCCNormal, setRelatorioAnaliseTCCNormal] = useState([]);
    const [relatorioAnaliseTCCAbaixo, setRelatorioAnaliseTCCAbaixo] = useState([]);
    const [analiseTCCDataPoint, setAnaliseTCCDataPoint] = useState<number>();

    const [titulacao, setTitulacao] = useState(null);
    const [titulacaoChart, setTitulacaoChart] = useState(null);

    const [relatorioTitulacaoGraduado, setRelatorioTitulacaoGraduado] = useState([]);
    const [relatorioTitulacaoMestrado, setRelatorioTitulacaoMestrado] = useState([]);
    const [relatorioTitulacaoDoutorado, setRelatorioTitulacaoDoutorado] = useState([]);
    const [titulacaoDataPoint, setTitulacaoDataPoint] = useState<number>();

    const [titulacaoRegime, setTitulacaoRegime] = useState(null);
    const [titulacaoRegimeChart, setTitulacaoRegimeChart] = useState(null);
    const [titulacaoRegimeDataPoint, setTitulacaoRegimeDataPoint] = useState<number>();

    const [relatorioTitulacaoRegimePPI40, setRelatorioTitulacaoRegimePPI40] = useState([]); // PPI40 + PPI44
    const [relatorioTitulacaoRegimePPP30, setRelatorioTitulacaoRegimePPP30] = useState([]);
    const [relatorioTitulacaoRegimePPP20, setRelatorioTitulacaoRegimePPP20] = useState([]);
    const [relatorioTitulacaoRegimePPP16, setRelatorioTitulacaoRegimePPP16] = useState([]);
    const [relatorioTitulacaoRegimePPA, setRelatorioTitulacaoRegimePPA] = useState([]);

    const [titulacaoTcc, setTitulacaoTcc] = useState(null);
    const [titulacaoTccChart, setTitulacaoTccChart] = useState(null);

    const [relatorioTitulacaoTccGraduado, setRelatorioTitulacaoTccGraduado] = useState([]);
    const [relatorioTitulacaoTccMestrado, setRelatorioTitulacaoTccMestrado] = useState([]);
    const [relatorioTitulacaoTccDoutorado, setRelatorioTitulacaoTccDoutorado] = useState([]);
    const [titulacaoTccDataPoint, setTitulacaoTccDataPoint] = useState<number>();

    const [tccRegime, setTccRegime] = useState(null);
    const [tccRegimeChart, setTccRegimeChart] = useState(null);
    const [tccRegimeDataPoint, setTccRegimeDataPoint] = useState<number>();

    const [relatorioTccRegimePPI40, setRelatorioTccRegimePPI40] = useState([]); // PPI40 + PPI44
    const [relatorioTccRegimePPP30, setRelatorioTccRegimePPP30] = useState([]);
    const [relatorioTccRegimePPP20, setRelatorioTccRegimePPP20] = useState([]);
    const [relatorioTccRegimePPP16, setRelatorioTccRegimePPP16] = useState([]);

    const [qtdDocenteComTCC, setQtdDocenteComTCC] = useState(null);
    const [qtdDocenteComTCCChart, setQtdDocenteComTCCChart] = useState(null);

    const [relatorioQtdDocenteComTCCPPI, setRelatorioQtdDocenteComTCCPPI] = useState([]);
    const [relatorioQtdDocenteComTCCPPP, setRelatorioQtdDocenteComTCCPPP] = useState([]);
    const [relatorioQtdDocenteComTCCPPIAndPPP, setRelatorioQtdDocenteComTCCPPIAndPPP] = useState([]);

    const [qtdDocenteComTCCDataPoint, setQtdDocenteComTCCDataPoint] = useState<number>();

    const [qtdDocenteSemTCC, setQtdDocenteSemTCC] = useState(null);
    const [qtdDocenteSemTCCChart, setQtdDocenteSemTCCChart] = useState(null);

    const [relatorioQtdDocenteSemTCCPPI, setRelatorioQtdDocenteSemTCCPPI] = useState([]);
    const [relatorioQtdDocenteSemTCCPPP, setRelatorioQtdDocenteSemTCCPPP] = useState([]);
    const [relatorioQtdDocenteSemTCCPPIAndPPP, setRelatorioQtdDocenteSemTCCPPIAndPPP] = useState([]);
    const [qtdDocenteSemTCCDataPoint, setQtdDocenteSemTCCDataPoint] = useState<number>();

    // === START LOGS GESTORES ===
    const [relatorioLogsGestoresFiltered, setRelatorioLogsGestoresFiltered] = useState([]);
    const [revisaoDataPoint, setRevisaoDataPoint] = useState<number>();
    const [revisaoChart, setRevisaoChart] = useState(null);
    const [relatorioGestoresAprovacoes, setRelatorioGestoresAprovacoes] = useState([]);
    const [relatorioGestoresReprovacoes, setRelatorioGestoresReprovacoes] = useState([]);
    const [relatorioGestoresRevisoes, setRelatorioGestoresRevisoes] = useState([]);
    const [relatorioGestoresNaoAvaliaram, setRelatorioGestoresNaoAvaliaram] = useState([]);
    const disclosureLogsGestores = useDisclosure();
     // === END LOGS GESTORES ===

    // LOGS GESORES -> ENSINO
    const [logsGestoresEnsino, setLogsGestoresEnsino] = useState(null);
    const [logsGestoresEnsinoChart, setLogsGestoresEnsinoChart] = useState(null);
    const [logsGestoresEnsinoData, setLogsGestoresEnsinoData] = useState([]);
    const [logsGestoresEnsinoDataPoint, setLogsGestoresEnsinoDataPoint] = useState<number>();

    // LOGS GESTORES -> PESQUISA
    const [logsGestoresPesquisa, setLogsGestoresPesquisa] = useState(null);
    const [logsGestoresPesquisaChart, setLogsGestoresPesquisaChart] = useState(null);
    const [logsGestoresPesquisaData, setLogsGestoresPesquisaData] = useState([]);
    const [logsGestoresPesquisaDataPoint, setLogsGestoresPesquisaDataPoint] = useState<number>();

     // LOGS GESTORES -> EXTENSAO
     const [logsGestoresExtensao, setLogsGestoresExtensao] = useState(null);
     const [logsGestoresExtensaoChart, setLogsGestoresExtensaoChart] = useState(null);
     const [logsGestoresExtensaoData, setLogsGestoresExtensaoData] = useState([]);
     const [logsGestoresExtensaoDataPoint, setLogsGestoresExtensaoDataPoint] = useState<number>();


    const { isOpen, onClose, onOpen } = useDisclosure();

    const { register, handleSubmit, formState, setValue } = useForm();

    async function changeCampus(codCampus: null | number) {
        filtroData.campus = codCampus;
        filtroData.unidade = '';
        filtroData.curso = '';
        filtroData.modalidade = '';
        filtroData.regime = '';
        filtroData.funcao = '';
        setValue("codigoUnidade", '');
        setValue("codigoCurso", '');
        setValue("codigoModalidade", '');
        setValue("codigoRegime", '');
        setValue("codigoFuncao", '');
        setFiltroData(filtroData);
        await filteredStates();
    }

    async function changeUnidade(codUnidade: null | number) {
        filtroData.unidade = codUnidade;
        filtroData.curso = '';
        filtroData.modalidade = '';
        filtroData.regime = '';
        filtroData.funcao = '';
        setValue("codigoCurso", '');
        setValue("codigoModalidade", '');
        setValue("codigoRegime", '');
        setValue("codigoFuncao", '');
        setFiltroData(filtroData);
        await filteredStates();
    }

    function changeCurso(codCurso: null | number) {
        filtroData.curso = codCurso;
        filtroData.regime = '';
        filtroData.funcao = '';
        setValue("codigoRegime", '');
        setValue("codigoFuncao", '');
        setFiltroData(filtroData);
    }

    function changeModalidade(codigoModalidade: null | number) {
        filtroData.modalidade = codigoModalidade;
        setFiltroData(filtroData);
    }

    function changeRegime(regime: null | number) {
        filtroData.regime = regime;
        setFiltroData(filtroData);
    }

    function changeFuncao(funcao: null | number) {
        filtroData.funcao = funcao;
        setFiltroData(filtroData);
    }

    function resetDatapointSelected(): void {
        setCargaHorariaTotalEnsinoDataPoint(undefined);
        setCargaHorariaTotalDataPoint(undefined);
        setDimensaoDataPoint(undefined);
        setAnaliseDataPoint(undefined);
        setSubmissaoDataPoint(undefined);
        setAnaliseTCCDataPoint(undefined);
        setTitulacaoDataPoint(undefined);
        setTitulacaoRegimeDataPoint(undefined);
        setTitulacaoTccDataPoint(undefined);
        setTccRegimeDataPoint(undefined);
        setQtdDocenteComTCCDataPoint(undefined);
        setQtdDocenteSemTCCDataPoint(undefined);
        setRelatorioFiltered([]);
        
        // Logs gestores
        // setRevisaoDataPoint(undefined);
        // setRelatorioLogsGestoresFiltered([]);

        let getFiltroLocal = JSON.parse(context.getFiltroDashboard())
        getFiltroLocal.selected.grafico.cargaHorariaTotalEnsino = null;
        getFiltroLocal.selected.grafico.cargaHorariaTotal = null;
        getFiltroLocal.selected.grafico.dimensao = null;
        getFiltroLocal.selected.grafico.analise = null;
        getFiltroLocal.selected.grafico.analiseTCC = null;
        getFiltroLocal.selected.grafico.submissao = null;
        getFiltroLocal.selected.grafico.titulacao = null;
        getFiltroLocal.selected.grafico.titulacaoRegime = null;
        getFiltroLocal.selected.grafico.titulacaoTcc = null;
        getFiltroLocal.selected.grafico.tccRegime = null;
        getFiltroLocal.selected.grafico.qtdDocenteComTCC = null;
        getFiltroLocal.selected.grafico.qtdDocenteSemTCC = null;
        context.changeFiltroDashboard(JSON.stringify(getFiltroLocal));
    }

    async function filteredStates() {

        let goBack = localStorage.getItem("pda.dashboard.goback");

        var campusResults, unidadesResults, cursosResults;

        if (goBack) {

            let fd: any = {};

            let originData = JSON.parse(context.getFiltroDashboard());

            let selected = originData.selected;

            let filtroCampus = selected.campus;
            let filtroUnidade = selected.unidade;
            let filtroCurso = selected.curso;
            let filtroRegime = selected.regime;
            let filtroFuncao = selected.funcao;

            campusResults = originData.campus; // filtrados
            setCampus(campusResults);
            setCampusFiltered(campusResults);

            var codCampus = !filtroCampus ? campusResults[0].value : Number(filtroCampus);
            fd.campus = codCampus;
            setValue("codigoCampus", fd.campus);

            unidadesResults = originData.unidades; // filtrados
            setUnidades(unidadesResults);
            setUnidadesFiltered(unidadesResults);

            var codUnidade = !filtroUnidade ? unidadesResults[0].value : Number(filtroUnidade);
            fd.unidade = codUnidade;

            setValue("codigoUnidade", fd.unidade)

            cursosResults = originData.cursos; // filtrados
            setCursos(cursosResults);
            setCursosFiltered(cursosResults)

            fd.curso = !filtroCurso ? cursosResults[0].value : Number(filtroCurso);
            setValue("codigoCurso", fd.curso)

            setValue("codigoRegime", filtroRegime);
            setValue("codigoFuncao", filtroFuncao);

            setFiltroData(fd);

            // Gráfico Carga Horaria Total Ensino
            if (selected.grafico.cargaHorariaTotalEnsino >= 0 && selected.grafico.cargaHorariaTotalEnsino !== undefined && selected.grafico.cargaHorariaTotalEnsino !== null) {
                setCargaHorariaTotalEnsino(selected.grafico.cargaHorariaTotalEnsino);
            }

            // Gráfico Carga Horaria Total
            if (selected.grafico.cargaHorariaTotal >= 0 && selected.grafico.cargaHorariaTotal !== undefined && selected.grafico.cargaHorariaTotal !== null) {
                setCargaHorariaTotal(selected.grafico.cargaHorariaTotal)
            }

            // Gráfico Dimensão
            if (selected.grafico.dimensao >= 0 && selected.grafico.dimensao !== undefined && selected.grafico.dimensao !== null) {
                setDimensaoDataPoint(selected.grafico.dimensao)
            }

            // Gráfico Analise
            if (selected.grafico.analise >= 0 && selected.grafico.analise !== undefined && selected.grafico.analise !== null) {
                setAnaliseDataPoint(selected.grafico.analise)
            }

            // Gráfico Submissão
            if (selected.grafico.submissao >= 0 && selected.grafico.submissao !== undefined && selected.grafico.submissao !== null) {
                setSubmissaoDataPoint(selected.grafico.submissao)
            }

            // Gráfico Analise TCC
            if (selected.grafico.analiseTCC >= 0 && selected.grafico.analiseTCC !== undefined && selected.grafico.analiseTCC !== null) {
                setAnaliseTCCDataPoint(selected.grafico.analiseTCC)
            }

            // Gráfico Titulação
            if (selected.grafico.titulacao >= 0 && selected.grafico.titulacao !== undefined && selected.grafico.titulacao !== null) {
                setTitulacaoDataPoint(selected.grafico.titulacao)
            }

            // Gráfico Titulação Regime
            if (selected.grafico.titulacaoRegime >= 0 && selected.grafico.titulacaoRegime !== undefined && selected.grafico.titulacaoRegime !== null) {
                setTitulacaoRegimeDataPoint(selected.grafico.titulacaoRegime)
            }

            // Gráfico Titulação TCC
            if (selected.grafico.titulacaoTcc >= 0 && selected.grafico.titulacaoTcc !== undefined && selected.grafico.titulacaoTcc !== null) {
                setTitulacaoTccDataPoint(selected.grafico.titulacaoTcc)
            }

            // Gráfico TCC Regime
            if (selected.grafico.tccRegime >= 0 && selected.grafico.tccRegime !== undefined && selected.grafico.tccRegime !== null) {
                setTccRegimeDataPoint(selected.grafico.tccRegime)
            }

            // Gráfico Média docentes com TCC
            if (selected.grafico.qtdDocenteComTCC >= 0 && selected.grafico.qtdDocenteComTCC !== undefined && selected.grafico.qtdDocenteComTCC !== null) {
                setQtdDocenteComTCCDataPoint(selected.grafico.qtdDocenteComTCC)
            }

            // Gráfico Quantidade de docentes sem TCC
            if (selected.grafico.qtdDocenteSemTCC >= 0 && selected.grafico.qtdDocenteSemTCC !== undefined && selected.grafico.qtdDocenteSemTCC !== null) {
                setQtdDocenteSemTCCDataPoint(selected.grafico.qtdDocenteSemTCC)
            }

            setRelatorio(originData.rows.relatorio);
            setRelatorioPPAs(originData.rows.relatorioPPAs);

            setAnalise(originData.rows.analise)
            setRelatorioAnaliseAcima(originData.rows.relatorioAnaliseAcima);
            setRelatorioAnaliseNormal(originData.rows.relatorioAnaliseNormal);
            setRelatorioAnaliseAbaixo(originData.rows.relatorioAnaliseAbaixo);

            setRelatorioSubmetidos(originData.rows.relatorioSubmetidos);
            setRelatorioNaoSubmetidos(originData.rows.relatorioNaoSubmetidos);

            setDimensao(originData.rows.dimensao);
            setRelatorioDimensaoEnsino(originData.rows.relatorioDimensaoEnsino);
            setRelatorioDimensaoPesquisa(originData.rows.relatorioDimensaoPesquisa);
            setRelatorioDimensaoExtensao(originData.rows.relatorioDimensaoExtensao);
            setRelatorioDimensaoGestao(originData.rows.relatorioDimensaoGestao);

            setSubmissao(originData.rows.submissao);

            setCargaHorariaTotal(originData.rows.cargaHorariaTotal);
            setRelatorioCargaHorariaTotalOciosas(originData.rows.relatorioCargaHorariaTotalOciosas);
            setRelatorioCargaHorariaTotalOcupadas(originData.rows.relatorioCargaHorariaTotalOcupadas);

            setCargaHorariaTotalEnsino(originData.rows.cargaHorariaTotalEnsino);
            setRelatorioCargaHorariaTotalEnsinoOciosas(originData.rows.relatorioCargaHorariaTotalEnsinoOciosas);
            setRelatorioCargaHorariaTotalEnsinoOcupadas(originData.rows.relatorioCargaHorariaTotalEnsinoOcupadas);

            setAnaliseTCC(originData.rows.analiseTCC)
            setRelatorioAnaliseTCCAcima(originData.rows.relatorioAnaliseTCCAcima);
            setRelatorioAnaliseTCCNormal(originData.rows.relatorioAnaliseTCCNormal);
            setRelatorioAnaliseTCCAbaixo(originData.rows.relatorioAnaliseTCCAbaixo);

            setTitulacao(originData.rows.titulacao);
            setRelatorioTitulacaoGraduado(originData.rows.relatorioTitulacaoGraduado);
            setRelatorioTitulacaoMestrado(originData.rows.relatorioTitulacaoMestrado);
            setRelatorioTitulacaoDoutorado(originData.rows.relatorioTitulacaoDoutorado);

            setTitulacaoRegime(originData.rows.titulacaoRegime);
            setRelatorioTitulacaoRegimePPI40(originData.rows.relatorioTitulacaoRegimePPI40);
            setRelatorioTitulacaoRegimePPP30(originData.rows.relatorioTitulacaoRegimePPP30);
            setRelatorioTitulacaoRegimePPP20(originData.rows.relatorioTitulacaoRegimePPP20);
            setRelatorioTitulacaoRegimePPP16(originData.rows.relatorioTitulacaoRegimePPP16);
            setRelatorioTitulacaoRegimePPA(originData.rows.relatorioTitulacaoRegimePPA);

            setTitulacaoTcc(originData.rows.titulacaoTcc);
            setRelatorioTitulacaoTccGraduado(originData.rows.relatorioTitulacaoTccGraduado);
            setRelatorioTitulacaoTccMestrado(originData.rows.relatorioTitulacaoTccMestrado);
            setRelatorioTitulacaoTccDoutorado(originData.rows.relatorioTitulacaoTccDoutorado);

            setTccRegime(originData.rows.tccRegime);
            setRelatorioTccRegimePPI40(originData.rows.relatorioTccRegimePPI40);
            setRelatorioTccRegimePPP30(originData.rows.relatorioTccRegimePPP30);
            setRelatorioTccRegimePPP20(originData.rows.relatorioTccRegimePPP20);
            setRelatorioTccRegimePPP16(originData.rows.relatorioTccRegimePPP16);

            setQtdDocenteComTCC(originData.rows.qtdDocenteComTCC);
            setRelatorioQtdDocenteComTCCPPI(originData.rows.relatorioQtdDocenteComTCCPPI);
            setRelatorioQtdDocenteComTCCPPP(originData.rows.relatorioQtdDocenteComTCCPPP);
            setRelatorioQtdDocenteComTCCPPIAndPPP(originData.rows.relatorioQtdDocenteComTCCPPIAndPPP);

            setQtdDocenteSemTCC(originData.rows.qtdDocenteSemTCC);
            setRelatorioQtdDocenteSemTCCPPI(originData.rows.relatorioQtdDocenteSemTCCPPI);
            setRelatorioQtdDocenteSemTCCPPP(originData.rows.relatorioQtdDocenteSemTCCPPP);
            setRelatorioQtdDocenteSemTCCPPIAndPPP(originData.rows.relatorioQtdDocenteSemTCCPPIAndPPP);

            // setRelatorioGestoresAprovacoes(originData.rows.relatorioGestoresAprovacoes);
            // setRelatorioGestoresReprovacoes(originData.rows.relatorioGestoresReprovacoes);
            // setRelatorioGestoresRevisoes(originData.rows.relatorioGestoresRevisoes);
            // setRelatorioGestoresNaoAvaliaram(originData.rows.relatorioGestoresNaoAvaliaram);

            resetLocalStorages(["pda.dashboard.goback"])

            setCurrentTab(originData.currentTab);
            setCurrentSubTab(originData.currentSubTab);

            setFiltro(true);
        }
        else {

            let filtroCampus = filtroData.campus;
            let filtroUnidade = filtroData.unidade;
            let filtroCurso = filtroData.curso;

            const cursosAnoSemestre = await api.get<ICodigoCursoAnoSemestre[]>(`/ensino_service/pda/plano/${context.getAnoSemestreSelected()}/cursos`);

            campusResults = await getFiltroCampus(role)
            setCampus(campusResults);
            setCampusFiltered(campusResults);

            var codCampus = !filtroCampus ? campusResults[0].value : Number(filtroCampus);
            filtroData.campus = codCampus;
            setValue("codigoCampus", filtroData.campus);

            unidadesResults = getFiltroUnidades(codCampus, role)

            setUnidades(unidadesResults);
            setUnidadesFiltered(unidadesResults);

            var codUnidade = !filtroUnidade || filtroUnidade === null ? unidadesResults[0].value : Number(filtroUnidade);
            filtroData.unidade = codUnidade;
            setValue("codigoUnidade", filtroData.unidade);

            cursosResults = await getFiltroCursos(codCampus, codUnidade, role)
            let original = cursosResults;
            cursosResults = cursosResults.filter(curso => cursosAnoSemestre.data.find(cursoValido => cursoValido.curso == String(curso.value) || String(curso.value) === ""));

            setCursos(cursosResults);
            setCursosFiltered(cursosResults)

            filtroData.curso = !filtroCurso ? cursosResults[0].value : Number(filtroCurso);
            setValue("codigoCurso", filtroData.curso);

            setFiltroData(filtroData);

        }

    }

    useMemo(() => {
        if (hasPerm(role, ["ADMIN", "PRO_REITOR_PRPA", "COORDENADOR_PRPA", "COORDENADOR_CIT", "COORDENADOR_CFP", "COORDENADOR_CPEX", "COORDENADOR_CGC","COMPLIANCE","COORDENADOR_PRO_REITORIA"])) {
            filtroData.campus = null;
            filtroData.unidade = null;
            filtroData.curso = null;
            setFiltroData(filtroData);
        }
        filteredStates();
    }, [context.getAnoSemestreSelected()])

    const validarMinistraGraduacao = (drt: number, aulas, filtroCampus = null, filtroUnidade = null, filtroCurso = null): string => {
        if (filtroCurso) {
            return aulas.find(aula => aula.drt == drt && aula.codigoCampus == filtroCampus && aula.codigoUnidade == filtroUnidade && aula.codigoCurso == filtroCurso) !== undefined ? "SIM" : "NÃO";
        } else if (filtroUnidade) {
            return aulas.find(aula => aula.drt == drt && aula.codigoCampus == filtroCampus && aula.codigoUnidade == filtroUnidade) !== undefined ? "SIM" : "NÃO";
        } else if (filtroCampus) {
            return aulas.find(aula => aula.drt == drt && aula.codigoCampus == filtroCampus) !== undefined ? "SIM" : "NÃO";
        } else {
            return aulas.find(aula => aula.drt == drt) !== undefined ? "SIM" : "NÃO";
        }
    }

    async function handleFiltrar(): Promise<SubmitHandler<filtroProps>> {

        setCargaHorariaTotalEnsinoDataPoint(undefined);
        setCargaHorariaTotalDataPoint(undefined);
        setDimensaoDataPoint(undefined);
        setSubmissaoDataPoint(undefined);
        setAnaliseDataPoint(undefined)
        setAnaliseTCCDataPoint(undefined)
        setTitulacaoDataPoint(undefined);
        setTitulacaoRegimeDataPoint(undefined);
        setTitulacaoTccDataPoint(undefined);
        setTccRegimeDataPoint(undefined);
        setQtdDocenteComTCCDataPoint(undefined);
        setQtdDocenteSemTCCDataPoint(undefined);

        setRevisaoDataPoint(undefined);

        let filtroCampus = filtroData.campus;
        let filtroUnidade = filtroData.unidade;
        let filtroCurso = filtroData.curso;
        let filtroRegime = filtroData.regime;
        let filtroFuncao = filtroData.funcao;

        let url = "";

        if (filtroCampus && filtroCampus != null) {
            url += '/' + filtroCampus;
            if (filtroUnidade && filtroCampus !== null) {
                url += '/' + filtroUnidade;
                if (filtroCurso && filtroCampus !== null) {
                    url += '/' + filtroCurso;
                }
            }
        }

        let params = "";
        if (filtroCampus) params += `campus=${filtroCampus}`;
        if (filtroUnidade) params += `&unidade=${filtroUnidade}`;
        if (filtroFuncao) params += (params ? "&" : "") + `funcao=${filtroFuncao}`;

        try {

            const getIppg = (Number(filtroCurso) <= 13 && Number(filtroCurso) > 0) ? "/ppg" : "";

            var getRelatorio = api.get(`/relatorio/plano/docentes${getIppg}/${context.getAnoSemestreSelected()}/${url}`);
            var getRelatorioOrientacaoTCC = api.get(`/relatorio/orientacao/tcc/docentes/${context.getAnoSemestreSelected()}${url}`)
            var hasAulasTeoricoPratica = api.get(`/ensino_service/pda/aulas/total/${context.getAnoSemestreSelected()}`);

            const response = await Promise.all([getRelatorio, getRelatorioOrientacaoTCC, hasAulasTeoricoPratica]).then((values) => {
                return values;
            });

            var responseRelatorioComPPas = response[0].data;
            var responseRelatorioSemPPas = response[0].data.filter(docente => docente.regime != TipoRegime.PPA);
            var responseRelatorioOrientacaoTCC = response[1];
            var responseHasAulasTeoricoPratica = response[2].data;

            // Saber se docente ORIENTA TCC
            responseRelatorioComPPas.map(docente => {
                let orientaTcc = responseRelatorioOrientacaoTCC.data.find(docenteTcc => docenteTcc.docente.drt == docente.drt && docenteTcc.totalOrientacaoTcc > 0) ? true : false;
                docente.orientaTcc = orientaTcc ? "SIM" : "NÃO";

                // fazer filtro em hasAulasTeoricoPratica do drt do docente considernado os filtros de front-end (campus, unidade e curso)
                docente.aulaGraduacao = validarMinistraGraduacao(docente.drt, responseHasAulasTeoricoPratica, filtroCampus, filtroUnidade, filtroCurso);
            })

            // Regras somente para aba Vinculo do docente
            if ((showAbaVinculo || hasFullPermissao) && filtroCurso) {

                const promiseDrts = await Promise.all(
                    responseRelatorioOrientacaoTCC.data.filter(docente => docente.totalOrientacaoTcc > 0).map(docente => {
                        let docenteExiste = responseRelatorioComPPas.find(docenteE => docenteE.drt == docente.docente.drt);
                        if (!docenteExiste) {
                            return docente.docente.drt;
                        }
                    })
                )

                // docentes que orienta TCC mas que não estão nos registros do "relatório principal" pois não ministram aulas no curso selecionado
                let drtsDocentes = new URLSearchParams();
                promiseDrts.forEach(drt => {
                    // warning! pode vir como 'undefined' do promise.all
                    if (drt > 0) {
                        drtsDocentes.append("drts", String(drt))
                    }
                });

                if (drtsDocentes.toString() !== "") {
                    let responseRelatorioExceções = await api.get(`/relatorio/plano/docentes/${context.getAnoSemestreSelected()}/`, {
                        params: drtsDocentes
                    })
                    responseRelatorioExceções.data.map(docente => {
                        docente.aulaGraduacao = validarMinistraGraduacao(docente.drt, responseHasAulasTeoricoPratica, filtroCampus, filtroUnidade, filtroCurso);
                        docente.orientaTcc = "SIM";
                        responseRelatorioComPPas.push(docente);
                    });
                }
            }

            if (hasFullPermissao && responseRelatorioSemPPas.length) {
                if (filtroRegime >= 0 && filtroRegime !== null && filtroRegime !== '') {
                    responseRelatorioSemPPas = responseRelatorioSemPPas.filter(item => item.regime == filtroData.regime);
                }
                if (filtroFuncao >= 0 && filtroData.funcao !== null && filtroData.funcao !== "") {
                    responseRelatorioSemPPas = responseRelatorioSemPPas.filter(item => item.gestao.comissionadas > 0 && item.gestao.funcao == filtroData.funcao);
                    responseRelatorioOrientacaoTCC.data = responseRelatorioOrientacaoTCC.data.filter(docenteTcc => {
                        return responseRelatorioSemPPas.find(docente => docente.drt == docenteTcc.docente.drt) ? true : false;
                    })
                }
            }

            if (hasFullPermissao && responseRelatorioComPPas.length) {
                if (filtroRegime >= 0 && filtroRegime !== null && filtroRegime !== '') {
                    responseRelatorioComPPas = responseRelatorioComPPas.filter(item => item.regime == filtroData.regime);
                }
                if (filtroFuncao >= 0 && filtroData.funcao !== null && filtroData.funcao !== "") {
                    responseRelatorioComPPas = responseRelatorioComPPas.filter(item => item.gestao.comissionadas > 0 && item.gestao.funcao == filtroData.funcao);
                    responseRelatorioOrientacaoTCC.data = responseRelatorioOrientacaoTCC.data.filter(docenteTcc => {
                        return responseRelatorioComPPas.find(docente => docente.drt == docenteTcc.docente.drt) ? true : false;
                    })
                }
            }

            setRelatorio(responseRelatorioSemPPas)
            setRelatorioPPAs(responseRelatorioComPPas)

            // Gráfico de Análise
            const responseAnalise = await GerarAnalise(responseRelatorioSemPPas)
            setAnalise(responseAnalise.analise)
            setRelatorioAnaliseAcima(responseAnalise.relatorioAcima);
            setRelatorioAnaliseNormal(responseAnalise.relatorioNormal);
            setRelatorioAnaliseAbaixo(responseAnalise.relatorioAbaixo);

            // Gráfico de dimensao
            const responseDimensao = await GerarDistribuicao(responseRelatorioSemPPas);
            setDimensao(responseDimensao.dimensao);
            setRelatorioDimensaoEnsino(responseDimensao.relatorioDimensaoEnsino);
            setRelatorioDimensaoPesquisa(responseDimensao.relatorioDimensaoPesquisa);
            setRelatorioDimensaoExtensao(responseDimensao.relatorioDimensaoExtensao);
            setRelatorioDimensaoGestao(responseDimensao.relatorioDimensaoGestao);

            // Gráfico Submissão
            const responseSubmissao = await GerarSubmissao(responseRelatorioSemPPas);
            setRelatorioSubmetidos(responseSubmissao.relatorioSubmetidos);
            setRelatorioNaoSubmetidos(responseSubmissao.relatorioNaoSubmetidos);
            setSubmissao(responseSubmissao.submissao);

            // Gráfico Carga horária Total
            const responseCargaHorariaTotal = await GerarCargaHorariaTotal(responseRelatorioSemPPas);
            setRelatorioCargaHorariaTotalOcupadas(responseCargaHorariaTotal.relatorioCargaHorariaTotalOcupadas);
            setRelatorioCargaHorariaTotalOciosas(responseCargaHorariaTotal.relatorioCargaHorariaTotalOciosas);
            setCargaHorariaTotal(responseCargaHorariaTotal.cargaHorariaTotal);

            // Gráfico Carga horária Total Ensino
            const responseCargaHorariaTotalEnsino = await GerarCargaHorariaTotalEnsino(responseRelatorioSemPPas);
            setRelatorioCargaHorariaTotalEnsinoOcupadas(responseCargaHorariaTotalEnsino.relatorioCargaHorariaTotalEnsinoOcupadas);
            setRelatorioCargaHorariaTotalEnsinoOciosas(responseCargaHorariaTotalEnsino.relatorioCargaHorariaTotalEnsinoOciosas);
            setCargaHorariaTotalEnsino(responseCargaHorariaTotalEnsino.cargaHorariaTotalEnsino);

            // Gráfico de Análise TCC
            const responseAnaliseTCC = await GerarAnaliseTCC(responseRelatorioSemPPas, responseRelatorioOrientacaoTCC.data)
            setAnaliseTCC(responseAnaliseTCC.analiseTCC)
            setRelatorioAnaliseTCCAcima(responseAnaliseTCC.relatorioTCCAcima);
            setRelatorioAnaliseTCCNormal(responseAnaliseTCC.relatorioTCCNormal);
            setRelatorioAnaliseTCCAbaixo(responseAnaliseTCC.relatorioTCCAbaixo);

            // Gráfico de Titulações c/ PPA
            const responseTitulacao = await GerarDocenteTitulacao(responseRelatorioComPPas);
            setTitulacao(responseTitulacao);
            setRelatorioTitulacaoGraduado(responseTitulacao.relatorioGraduado);
            setRelatorioTitulacaoMestrado(responseTitulacao.relatorioMestrado);
            setRelatorioTitulacaoDoutorado(responseTitulacao.relatorioDoutorado);

            // Gráfico de Titulações Regimes c/ PPA
            const responseTitulacaoRegime = await GerarDocenteTitulacaoRegime(responseRelatorioComPPas);
            setTitulacaoRegime(responseTitulacaoRegime);
            setRelatorioTitulacaoRegimePPI40(responseTitulacaoRegime.relatorioPPI40);
            setRelatorioTitulacaoRegimePPP30(responseTitulacaoRegime.relatorioPPP30);
            setRelatorioTitulacaoRegimePPP20(responseTitulacaoRegime.relatorioPPP20);
            setRelatorioTitulacaoRegimePPP16(responseTitulacaoRegime.relatorioPPP16);
            setRelatorioTitulacaoRegimePPA(responseTitulacaoRegime.relatorioPPA);

            // Gráfico de Titulações TCC
            const responseTitulacaoTcc = await GerarDocenteTitulacaoTcc(responseRelatorioOrientacaoTCC.data, responseRelatorioSemPPas);
            setTitulacaoTcc(responseTitulacaoTcc);
            setRelatorioTitulacaoTccGraduado(responseTitulacaoTcc.relatorioTccGraduado);
            setRelatorioTitulacaoTccMestrado(responseTitulacaoTcc.relatorioTccMestrado);
            setRelatorioTitulacaoTccDoutorado(responseTitulacaoTcc.relatorioTccDoutorado);

            // Gráfico TCC Regimes
            const responseTccRegime = await GerarDocenteTccRegime(responseRelatorioOrientacaoTCC.data, responseRelatorioSemPPas);
            setTccRegime(responseTccRegime);
            setRelatorioTccRegimePPI40(responseTccRegime.relatorioPPI40);
            setRelatorioTccRegimePPP30(responseTccRegime.relatorioPPP30);
            setRelatorioTccRegimePPP20(responseTccRegime.relatorioPPP20);
            setRelatorioTccRegimePPP16(responseTccRegime.relatorioPPP16);

            // Gráfico quantidade de docentes COM TCC
            const responseQtdDocenteComTCC = await GerarQtdDocenteComTCC(responseRelatorioOrientacaoTCC.data, responseRelatorioSemPPas);
            setQtdDocenteComTCC(responseQtdDocenteComTCC);
            setRelatorioQtdDocenteComTCCPPI(responseQtdDocenteComTCC.relatorioPPI);
            setRelatorioQtdDocenteComTCCPPP(responseQtdDocenteComTCC.relatorioPPP);
            setRelatorioQtdDocenteComTCCPPIAndPPP(responseQtdDocenteComTCC.relatorioPPIAndPPP);

            // Gráfico Quantidade de Docentes SEM TCC
            const responseQtdDocenteSemTCC = await GerarQtdDocenteSemTCC(responseRelatorioOrientacaoTCC.data, responseRelatorioSemPPas);
            setQtdDocenteSemTCC(responseQtdDocenteSemTCC);
            setRelatorioQtdDocenteSemTCCPPI(responseQtdDocenteSemTCC.relatorioPPI);
            setRelatorioQtdDocenteSemTCCPPP(responseQtdDocenteSemTCC.relatorioPPP);
            setRelatorioQtdDocenteSemTCCPPIAndPPP(responseQtdDocenteSemTCC.relatorioPPIAndPPP);

            let addFiltroContext = {
                currentTab: currentTab,
                currentSubTab: currentSubTab,
                campus: campusFiltered,
                unidades: unidadesFiltered,
                cursos: cursosFiltered,
                selected: {
                    campus: filtroCampus,
                    unidade: filtroUnidade,
                    curso: filtroCurso,
                    regime: filtroRegime,
                    funcao: filtroFuncao,
                    grafico: {
                        cargaHorariaTotalEnsino: cargaHorariaTotalEnsinoDataPoint,
                        cargaHorariaTotal: cargaHorariaTotalDataPoint,
                        dimensao: dimensaoDataPoint,
                        analise: analiseDataPoint,
                        analiseTCC: analiseTCCDataPoint,
                        submissao: submissaoDataPoint,
                        titulacao: titulacaoDataPoint,
                        titulacaoRegime: titulacaoRegimeDataPoint,
                        titulacaoTcc: titulacaoTccDataPoint,
                        qtdDocenteComTCC: qtdDocenteComTCCDataPoint,
                        qtdDocenteSemTCC: qtdDocenteSemTCCDataPoint,
                    }
                },
                rows: {
                    relatorio: responseRelatorioSemPPas,
                    relatorioPPAs: responseRelatorioComPPas,

                    analise: responseAnalise.analise,
                    relatorioAnaliseAcima: responseAnalise.relatorioAcima,
                    relatorioAnaliseNormal: responseAnalise.relatorioNormal,
                    relatorioAnaliseAbaixo: responseAnalise.relatorioAbaixo,

                    relatorioSubmetidos: responseSubmissao.relatorioSubmetidos,
                    relatorioNaoSubmetidos: responseSubmissao.relatorioNaoSubmetidos,
                    submissao: responseSubmissao.submissao,

                    dimensao: responseDimensao.dimensao,
                    relatorioDimensaoEnsino: responseDimensao.relatorioDimensaoEnsino,
                    relatorioDimensaoPesquisa: responseDimensao.relatorioDimensaoPesquisa,
                    relatorioDimensaoExtensao: responseDimensao.relatorioDimensaoExtensao,
                    relatorioDimensaoGestao: responseDimensao.relatorioDimensaoGestao,

                    relatorioCargaHorariaTotalOciosas: responseCargaHorariaTotal.relatorioCargaHorariaTotalOciosas,
                    relatorioCargaHorariaTotalOcupadas: responseCargaHorariaTotal.relatorioCargaHorariaTotalOcupadas,
                    cargaHorariaTotal: responseCargaHorariaTotal.cargaHorariaTotal,

                    relatorioCargaHorariaTotalEnsinoOciosas: responseCargaHorariaTotalEnsino.relatorioCargaHorariaTotalEnsinoOciosas,
                    relatorioCargaHorariaTotalEnsinoOcupadas: responseCargaHorariaTotalEnsino.relatorioCargaHorariaTotalEnsinoOcupadas,
                    cargaHorariaTotalEnsino: responseCargaHorariaTotalEnsino.cargaHorariaTotalEnsino,

                    analiseTCC: responseAnaliseTCC.analiseTCC,
                    relatorioAnaliseTCCAcima: responseAnaliseTCC.relatorioTCCAcima,
                    relatorioAnaliseTCCNormal: responseAnaliseTCC.relatorioTCCNormal,
                    relatorioAnaliseTCCAbaixo: responseAnaliseTCC.relatorioTCCAbaixo,

                    titulacao: responseTitulacao,
                    relatorioTitulacaoGraduado: responseTitulacao.relatorioGraduado,
                    relatorioTitulacaoMestrado: responseTitulacao.relatorioMestrado,
                    relatorioTitulacaoDoutorado: responseTitulacao.relatorioDoutorado,

                    titulacaoRegime: responseTitulacaoRegime,
                    relatorioTitulacaoRegimePPI40: responseTitulacaoRegime.relatorioPPI40,
                    relatorioTitulacaoRegimePPP30: responseTitulacaoRegime.relatorioPPP30,
                    relatorioTitulacaoRegimePPP20: responseTitulacaoRegime.relatorioPPP20,
                    relatorioTitulacaoRegimePPP16: responseTitulacaoRegime.relatorioPPP16,
                    relatorioTitulacaoRegimePPA: responseTitulacaoRegime.relatorioPPA,

                    titulacaoTcc: responseTitulacaoTcc,
                    relatorioTitulacaoTccGraduado: responseTitulacaoTcc.relatorioTccGraduado,
                    relatorioTitulacaoTccMestrado: responseTitulacaoTcc.relatorioTccMestrado,
                    relatorioTitulacaoTccDoutorado: responseTitulacaoTcc.relatorioTccDoutorado,

                    tccRegime: responseTccRegime,
                    relatorioTccRegimePPI40: responseTccRegime.relatorioPPI40,
                    relatorioTccRegimePPP30: responseTccRegime.relatorioPPP30,
                    relatorioTccRegimePPP20: responseTccRegime.relatorioPPP20,
                    relatorioTccRegimePPP16: responseTccRegime.relatorioPPP16,

                    qtdDocenteComTCC: responseQtdDocenteComTCC,
                    relatorioQtdDocenteComTCCPPI: responseQtdDocenteComTCC.relatorioPPI,
                    relatorioQtdDocenteComTCCPPP: responseQtdDocenteComTCC.relatorioPPP,
                    relatorioQtdDocenteComTCCPPIAndPPP: responseQtdDocenteComTCC.relatorioPPIAndPPP,

                    qtdDocenteSemTCC: responseQtdDocenteSemTCC,
                    relatorioQtdDocenteSemTCCPPI: responseQtdDocenteSemTCC.relatorioPPI,
                    relatorioQtdDocenteSemTCCPPP: responseQtdDocenteSemTCC.relatorioPPP,
                    relatorioQtdDocenteSemTCCPPIAndPPP: responseQtdDocenteSemTCC.relatorioPPIAndPPP
                }
            };

            context.changeFiltroDashboard(JSON.stringify(addFiltroContext));

            setFiltro(true);

            //  // Start Logs Gestores

            //  var getLogsAcoesGestoresResponse = api.get<GestorAcoes[]>(`/relatorio/revisao/coordenador/${context.getAnoSemestreSelected()}?${params}`);
            //  const contratacoesGestoresResponse = api.get(`/docente_service/contratacao/${context.getAnoSemestreSelected()}`);
             
            //  const responseGestores = await Promise.all([getLogsAcoesGestoresResponse, contratacoesGestoresResponse]).then((values) => {
            //     return values;
            // });

            //  var logsAcoesGestores = responseGestores[0].data;
            //  var contratacoesGestores = responseGestores[1].data;
 
            //  let gestoresComAprovacoes = [];
            //  let gestoresComReprovacoes = [];
            //  let gestoresComRevisoes = [];
            //  let gestoresNaoAvaliaram = [];
 
            //  for (let i = 0; i < logsAcoesGestores.length; i++) {
            //      let responseGestor = logsAcoesGestores[i];
            //      let acoes = responseGestor.acoes;
            //      let gestor = contratacoesGestores.find(gestor => gestor.drt == responseGestor.drt);
            //      if (!gestor || filtroRegime >= 0 && filtroRegime !== null && filtroRegime !== '' && gestor.regime !== filtroRegime) continue;
            //      gestor.id = responseGestor.drt;
            //      gestor.codFuncaoComissionada = responseGestor.codFuncao;
            //      if (acoes.find(acao => acao == EstadoAtividade.REVISADO)) {
            //          gestoresComRevisoes.push(gestor);
            //      }
            //      if (acoes.find(acao => acao == EstadoAtividade.REPROVADO)) {
            //          gestoresComReprovacoes.push(gestor);
            //      }
            //      if (acoes.find(acao => acao == EstadoAtividade.APROVADO)) {
            //          gestoresComAprovacoes.push(gestor);
            //      }
            //      if (acoes.find(acao => acao == EstadoAtividade.RASCUNHO || acao == EstadoAtividade.SUBMETIDO) !== undefined) {
            //          gestoresNaoAvaliaram.push(gestor);
            //      }
            //  }
 
            //  setRelatorioGestoresAprovacoes(gestoresComAprovacoes);
            //  setRelatorioGestoresReprovacoes(gestoresComReprovacoes);
            //  setRelatorioGestoresRevisoes(gestoresComRevisoes);
            //  setRelatorioGestoresNaoAvaliaram(gestoresNaoAvaliaram);

            //  addFiltroContext.rows["relatorioGestoresAprovacoes"] = gestoresComAprovacoes;
            //  addFiltroContext.rows["relatorioGestoresReprovacoes"] = gestoresComReprovacoes;
            //  addFiltroContext.rows["relatorioGestoresRevisoes"] = gestoresComRevisoes;
            //  addFiltroContext.rows["relatorioGestoresNaoAvaliaram"] = gestoresNaoAvaliaram;
            
            // // End Logs Gestores
            // context.changeFiltroDashboard(JSON.stringify(addFiltroContext));

        } catch (error) {
            setFiltro(false);
            console.log(error)
            alert('Erro na busca do relatorio');
        }

        return;
    }

    useEffect(() => {

        if (cargaHorariaTotalEnsinoDataPoint == 0) {
            setRelatorioFiltered(relatorioCargaHorariaTotalEnsinoOcupadas);
        } else if (cargaHorariaTotalEnsinoDataPoint == 1) {
            setRelatorioFiltered(relatorioCargaHorariaTotalEnsinoOciosas);
        }

        if (cargaHorariaTotalEnsinoDataPoint !== null && cargaHorariaTotalEnsinoDataPoint !== undefined) {
            let getFiltroLocal = JSON.parse(context.getFiltroDashboard())
            getFiltroLocal.selected.grafico.titulacaoRegime = null;
            getFiltroLocal.selected.grafico.titulacao = null;
            getFiltroLocal.selected.grafico.titulacaoTcc = null;
            getFiltroLocal.selected.grafico.analiseTCC = null;
            getFiltroLocal.selected.grafico.analise = null;
            getFiltroLocal.selected.grafico.tccRegime = null;
            getFiltroLocal.selected.grafico.qtdDocenteComTCC = null;
            getFiltroLocal.selected.grafico.qtdDocenteSemTCC = null;
            getFiltroLocal.selected.grafico.submissao = null;
            getFiltroLocal.selected.grafico.dimensao = null;
            getFiltroLocal.selected.grafico.cargaHorariaTotal = null;
            getFiltroLocal.selected.grafico.cargaHorariaTotalEnsino = cargaHorariaTotalEnsinoDataPoint;
            onOpen();
            context.changeFiltroDashboard(JSON.stringify(getFiltroLocal));
        }
    }, [cargaHorariaTotalEnsinoDataPoint])


    useEffect(() => {

        if (cargaHorariaTotalDataPoint == 0) {
            setRelatorioFiltered(relatorioCargaHorariaTotalOcupadas);
        } else if (cargaHorariaTotalDataPoint == 1) {
            setRelatorioFiltered(relatorioCargaHorariaTotalOciosas);
        }

        if (cargaHorariaTotalDataPoint !== null && cargaHorariaTotalDataPoint !== undefined) {
            let getFiltroLocal = JSON.parse(context.getFiltroDashboard())
            getFiltroLocal.selected.grafico.cargaHorariaTotalEnsino = null;
            getFiltroLocal.selected.grafico.titulacaoRegime = null;
            getFiltroLocal.selected.grafico.titulacao = null;
            getFiltroLocal.selected.grafico.titulacaoTcc = null;
            getFiltroLocal.selected.grafico.analiseTCC = null;
            getFiltroLocal.selected.grafico.analise = null;
            getFiltroLocal.selected.grafico.tccRegime = null;
            getFiltroLocal.selected.grafico.qtdDocenteComTCC = null;
            getFiltroLocal.selected.grafico.qtdDocenteSemTCC = null;
            getFiltroLocal.selected.grafico.submissao = null;
            getFiltroLocal.selected.grafico.dimensao = null;
            getFiltroLocal.selected.grafico.cargaHorariaTotal = cargaHorariaTotalDataPoint;
            onOpen();
            context.changeFiltroDashboard(JSON.stringify(getFiltroLocal));
        }
    }, [cargaHorariaTotalDataPoint])

    useEffect(() => {

        if (dimensaoDataPoint == 0) {
            setRelatorioFiltered(relatorioDimensaoEnsino);
        } else if (dimensaoDataPoint == 1) {
            setRelatorioFiltered(relatorioDimensaoPesquisa);
        }else if (dimensaoDataPoint == 2) {
            setRelatorioFiltered(relatorioDimensaoExtensao);
        }else if (dimensaoDataPoint == 3) {
            setRelatorioFiltered(relatorioDimensaoGestao);
        }

        if (dimensaoDataPoint !== null && dimensaoDataPoint !== undefined) {
            let getFiltroLocal = JSON.parse(context.getFiltroDashboard())
            getFiltroLocal.selected.grafico.cargaHorariaTotalEnsino = null;
            getFiltroLocal.selected.grafico.cargaHorariaTotal = null;
            getFiltroLocal.selected.grafico.titulacaoRegime = null;
            getFiltroLocal.selected.grafico.titulacao = null;
            getFiltroLocal.selected.grafico.titulacaoTcc = null;
            getFiltroLocal.selected.grafico.analiseTCC = null;
            getFiltroLocal.selected.grafico.analise = null;
            getFiltroLocal.selected.grafico.tccRegime = null;
            getFiltroLocal.selected.grafico.qtdDocenteComTCC = null;
            getFiltroLocal.selected.grafico.qtdDocenteSemTCC = null;
            getFiltroLocal.selected.grafico.submissao = null;
            getFiltroLocal.selected.grafico.dimensao = dimensaoDataPoint;
            onOpen();
            context.changeFiltroDashboard(JSON.stringify(getFiltroLocal));
        }
    }, [dimensaoDataPoint])

    useEffect(() => {
        if (analiseTCCDataPoint !== null && analiseTCCDataPoint !== undefined) {
            if (analiseTCCDataPoint == 0) {
                setRelatorioFiltered(relatorioAnaliseTCCAcima);
            } else if (analiseTCCDataPoint == 1) {
                setRelatorioFiltered(relatorioAnaliseTCCAbaixo);
            } else if (analiseTCCDataPoint == 2) {
                setRelatorioFiltered(relatorioAnaliseTCCNormal);
            }
            let getFiltroLocal = JSON.parse(context.getFiltroDashboard())
            getFiltroLocal.selected.grafico.cargaHorariaTotalEnsino = null;
            getFiltroLocal.selected.grafico.cargaHorariaTotal = null;
            getFiltroLocal.selected.grafico.dimensao = null;
            getFiltroLocal.selected.grafico.analise = null;
            getFiltroLocal.selected.grafico.submissao = null;
            getFiltroLocal.selected.grafico.titulacaoRegime = null;
            getFiltroLocal.selected.grafico.titulacao = null;
            getFiltroLocal.selected.grafico.titulacaoTcc = null;
            getFiltroLocal.selected.grafico.tccRegime = null;
            getFiltroLocal.selected.grafico.qtdDocenteComTCC = null;
            getFiltroLocal.selected.grafico.qtdDocenteSemTCC = null;
            getFiltroLocal.selected.grafico.analiseTCC = analiseTCCDataPoint;
            onOpen();
            context.changeFiltroDashboard(JSON.stringify(getFiltroLocal));
        }
    }, [analiseTCCDataPoint])

    useEffect(() => {
        if (analiseDataPoint == 0) {
            setRelatorioFiltered(relatorioAnaliseAcima);
        } else if (analiseDataPoint == 2) {
            setRelatorioFiltered(relatorioAnaliseNormal);
        } else if (analiseDataPoint == 1) {
            setRelatorioFiltered(relatorioAnaliseAbaixo);
        }
        if (analiseDataPoint !== null && analiseDataPoint !== undefined) {
            let getFiltroLocal = JSON.parse(context.getFiltroDashboard())
            getFiltroLocal.selected.grafico.cargaHorariaTotalEnsino = null;
            getFiltroLocal.selected.grafico.cargaHorariaTotal = null;
            getFiltroLocal.selected.grafico.dimensao = null;
            getFiltroLocal.selected.grafico.submissao = null;
            getFiltroLocal.selected.grafico.titulacaoRegime = null;
            getFiltroLocal.selected.grafico.titulacao = null;
            getFiltroLocal.selected.grafico.titulacaoTcc = null;
            getFiltroLocal.selected.grafico.analiseTCC = null;
            getFiltroLocal.selected.grafico.tccRegime = null;
            getFiltroLocal.selected.grafico.qtdDocenteComTCC = null;
            getFiltroLocal.selected.grafico.qtdDocenteSemTCC = null;
            getFiltroLocal.selected.grafico.analise = analiseDataPoint;

            onOpen();
            context.changeFiltroDashboard(JSON.stringify(getFiltroLocal));
        }
    }, [analiseDataPoint])

    useEffect(() => {
        if (submissaoDataPoint == 0) {
            setRelatorioFiltered(relatorioSubmetidos);
        } else if (submissaoDataPoint == 1) {
            setRelatorioFiltered(relatorioNaoSubmetidos);
        }
        if (submissaoDataPoint !== null && submissaoDataPoint !== undefined) {
            let getFiltroLocal = JSON.parse(context.getFiltroDashboard())
            getFiltroLocal.selected.grafico.cargaHorariaTotalEnsino = null;
            getFiltroLocal.selected.grafico.cargaHorariaTotal = null;
            getFiltroLocal.selected.grafico.dimensao = null;
            getFiltroLocal.selected.grafico.titulacaoRegime = null;
            getFiltroLocal.selected.grafico.titulacao = null;
            getFiltroLocal.selected.grafico.titulacaoTcc = null;
            getFiltroLocal.selected.grafico.analiseTCC = null;
            getFiltroLocal.selected.grafico.analise = null;
            getFiltroLocal.selected.grafico.tccRegime = null;
            getFiltroLocal.selected.grafico.qtdDocenteComTCC = null;
            getFiltroLocal.selected.grafico.qtdDocenteSemTCC = null;
            getFiltroLocal.selected.grafico.submissao = submissaoDataPoint;
            onOpen();
            context.changeFiltroDashboard(JSON.stringify(getFiltroLocal));
        }
    }, [submissaoDataPoint])

    useEffect(() => {
        if (titulacaoDataPoint !== null && titulacaoDataPoint !== undefined) {

            const titulacaoSelecionada = {
                0: TipoTitulacao.DOUTORADO_COMPLETO,
                1: TipoTitulacao.MESTRADO_COMPLETO,
                2: TipoTitulacao.SUPERIOR_COMPLETO
            };

            if (titulacaoSelecionada[titulacaoDataPoint] == TipoTitulacao.SUPERIOR_COMPLETO) {
                setRelatorioFiltered(relatorioTitulacaoGraduado);
            }
            else if (titulacaoSelecionada[titulacaoDataPoint] == TipoTitulacao.MESTRADO_COMPLETO) {
                setRelatorioFiltered(relatorioTitulacaoMestrado);
            }
            else if (titulacaoSelecionada[titulacaoDataPoint] == TipoTitulacao.DOUTORADO_COMPLETO) {
                setRelatorioFiltered(relatorioTitulacaoDoutorado);
            }

            let getFiltroLocal = JSON.parse(context.getFiltroDashboard())
            getFiltroLocal.selected.grafico.cargaHorariaTotalEnsino = null;
            getFiltroLocal.selected.grafico.cargaHorariaTotal = null;
            getFiltroLocal.selected.grafico.dimensao = null;
            getFiltroLocal.selected.grafico.analise = null;
            getFiltroLocal.selected.grafico.analiseTCC = null;
            getFiltroLocal.selected.grafico.submissao = null;
            getFiltroLocal.selected.grafico.titulacaoRegime = null;
            getFiltroLocal.selected.grafico.titulacaoTcc = null;
            getFiltroLocal.selected.grafico.tccRegime = null;
            getFiltroLocal.selected.grafico.qtdDocenteComTCC = null;
            getFiltroLocal.selected.grafico.qtdDocenteSemTCC = null;
            getFiltroLocal.selected.grafico.titulacao = titulacaoDataPoint;
            onOpen();
            context.changeFiltroDashboard(JSON.stringify(getFiltroLocal));
        }
    }, [titulacaoDataPoint])

    useEffect(() => {
        if (titulacaoRegimeDataPoint !== null && titulacaoRegimeDataPoint !== undefined) {

            const regimeSelecionado = {
                0: TipoRegime.PPI,
                1: TipoRegime.PPP30,
                2: TipoRegime.PPP20,
                3: TipoRegime.PPP16,
                4: TipoRegime.PPA
            };

            if (regimeSelecionado[titulacaoRegimeDataPoint] == TipoRegime.PPI) {
                setRelatorioFiltered(relatorioTitulacaoRegimePPI40);
            } else if (regimeSelecionado[titulacaoRegimeDataPoint] == TipoRegime.PPP30) {
                setRelatorioFiltered(relatorioTitulacaoRegimePPP30);
            } else if (regimeSelecionado[titulacaoRegimeDataPoint] == TipoRegime.PPP20) {
                setRelatorioFiltered(relatorioTitulacaoRegimePPP20);
            } else if (regimeSelecionado[titulacaoRegimeDataPoint] == TipoRegime.PPP16) {
                setRelatorioFiltered(relatorioTitulacaoRegimePPP16);
            } else if (regimeSelecionado[titulacaoRegimeDataPoint] == TipoRegime.PPA) {
                setRelatorioFiltered(relatorioTitulacaoRegimePPA);
            }

            let getFiltroLocal = JSON.parse(context.getFiltroDashboard())
            getFiltroLocal.selected.grafico.cargaHorariaTotalEnsino = null;
            getFiltroLocal.selected.grafico.cargaHorariaTotal = null;
            getFiltroLocal.selected.grafico.dimensao = null;
            getFiltroLocal.selected.grafico.analise = null;
            getFiltroLocal.selected.grafico.analiseTCC = null;
            getFiltroLocal.selected.grafico.submissao = null;
            getFiltroLocal.selected.grafico.titulacao = null;
            getFiltroLocal.selected.grafico.titulacaoTcc = null;
            getFiltroLocal.selected.grafico.tccRegime = null;
            getFiltroLocal.selected.grafico.qtdDocenteComTCC = null;
            getFiltroLocal.selected.grafico.qtdDocenteSemTCC = null;
            getFiltroLocal.selected.grafico.titulacaoRegime = titulacaoRegimeDataPoint;
            onOpen();
            context.changeFiltroDashboard(JSON.stringify(getFiltroLocal));
        }
    }, [titulacaoRegimeDataPoint])

    useEffect(() => {
        if (titulacaoTccDataPoint !== null && titulacaoTccDataPoint !== undefined) {

            const titulacaoSelecionada = {
                0: TipoTitulacao.DOUTORADO_COMPLETO,
                1: TipoTitulacao.MESTRADO_COMPLETO,
                2: TipoTitulacao.SUPERIOR_COMPLETO
            };

            if (titulacaoSelecionada[titulacaoTccDataPoint] == TipoTitulacao.SUPERIOR_COMPLETO) {
                setRelatorioFiltered(relatorioTitulacaoTccGraduado);
            }
            else if (titulacaoSelecionada[titulacaoTccDataPoint] == TipoTitulacao.MESTRADO_COMPLETO) {
                setRelatorioFiltered(relatorioTitulacaoTccMestrado);
            }
            else if (titulacaoSelecionada[titulacaoTccDataPoint] == TipoTitulacao.DOUTORADO_COMPLETO) {
                setRelatorioFiltered(relatorioTitulacaoTccDoutorado);
            }

            let getFiltroLocal = JSON.parse(context.getFiltroDashboard())
            getFiltroLocal.selected.grafico.cargaHorariaTotalEnsino = null;
            getFiltroLocal.selected.grafico.cargaHorariaTotal = null;
            getFiltroLocal.selected.grafico.dimensao = null;
            getFiltroLocal.selected.grafico.analise = null;
            getFiltroLocal.selected.grafico.analiseTCC = null;
            getFiltroLocal.selected.grafico.submissao = null;
            getFiltroLocal.selected.grafico.titulacaoRegime = null;
            getFiltroLocal.selected.grafico.titulacao = null;
            getFiltroLocal.selected.grafico.tccRegime = null;
            getFiltroLocal.selected.grafico.qtdDocenteComTCC = null;
            getFiltroLocal.selected.grafico.qtdDocenteSemTCC = null;
            getFiltroLocal.selected.grafico.titulacaoTcc = titulacaoTccDataPoint;
            onOpen();
            context.changeFiltroDashboard(JSON.stringify(getFiltroLocal));
        }
    }, [titulacaoTccDataPoint])

    useEffect(() => {
        if (tccRegimeDataPoint !== null && tccRegimeDataPoint !== undefined) {

            const regimeSelecionado = {
                0: TipoRegime.PPI,
                1: TipoRegime.PPP30,
                2: TipoRegime.PPP20,
                3: TipoRegime.PPP16
            };

            if (regimeSelecionado[tccRegimeDataPoint] == TipoRegime.PPI) {
                setRelatorioFiltered(relatorioTccRegimePPI40);
            } else if (regimeSelecionado[tccRegimeDataPoint] == TipoRegime.PPP30) {
                setRelatorioFiltered(relatorioTccRegimePPP30);
            } else if (regimeSelecionado[tccRegimeDataPoint] == TipoRegime.PPP20) {
                setRelatorioFiltered(relatorioTccRegimePPP20);
            } else if (regimeSelecionado[tccRegimeDataPoint] == TipoRegime.PPP16) {
                setRelatorioFiltered(relatorioTccRegimePPP16);
            }

            let getFiltroLocal = JSON.parse(context.getFiltroDashboard())
            getFiltroLocal.selected.grafico.cargaHorariaTotalEnsino = null;
            getFiltroLocal.selected.grafico.cargaHorariaTotal = null;
            getFiltroLocal.selected.grafico.dimensao = null;
            getFiltroLocal.selected.grafico.analise = null;
            getFiltroLocal.selected.grafico.analiseTCC = null;
            getFiltroLocal.selected.grafico.submissao = null;
            getFiltroLocal.selected.grafico.titulacao = null;
            getFiltroLocal.selected.grafico.titulacaoTcc = null;
            getFiltroLocal.selected.grafico.titulacaoRegime = null;
            getFiltroLocal.selected.grafico.qtdDocenteComTCC = null;
            getFiltroLocal.selected.grafico.qtdDocenteSemTCC = null;
            getFiltroLocal.selected.grafico.tccRegime = tccRegimeDataPoint;
            onOpen();
            context.changeFiltroDashboard(JSON.stringify(getFiltroLocal));
        }
    }, [tccRegimeDataPoint])

    useEffect(() => {
        if (qtdDocenteComTCCDataPoint !== null && qtdDocenteComTCCDataPoint !== undefined) {
            if (qtdDocenteComTCCDataPoint === 0) {
                setRelatorioFiltered(relatorioQtdDocenteComTCCPPI);
            } else if (qtdDocenteComTCCDataPoint === 1) {
                setRelatorioFiltered(relatorioQtdDocenteComTCCPPP);
            } else if (qtdDocenteComTCCDataPoint === 2) {
                setRelatorioFiltered(relatorioQtdDocenteComTCCPPIAndPPP);
            }

            let getFiltroLocal = JSON.parse(context.getFiltroDashboard())
            getFiltroLocal.selected.grafico.cargaHorariaTotalEnsino = null;
            getFiltroLocal.selected.grafico.cargaHorariaTotal = null;
            getFiltroLocal.selected.grafico.dimensao = null;
            getFiltroLocal.selected.grafico.analise = null;
            getFiltroLocal.selected.grafico.analiseTCC = null;
            getFiltroLocal.selected.grafico.submissao = null;
            getFiltroLocal.selected.grafico.titulacao = null;
            getFiltroLocal.selected.grafico.titulacaoTcc = null;
            getFiltroLocal.selected.grafico.titulacaoRegime = null;
            getFiltroLocal.selected.grafico.tccRegime = null;
            getFiltroLocal.selected.grafico.qtdDocenteSemTCC = null;
            getFiltroLocal.selected.grafico.qtdDocenteComTCC = qtdDocenteComTCCDataPoint;
            onOpen();
            context.changeFiltroDashboard(JSON.stringify(getFiltroLocal));
        }
    }, [qtdDocenteComTCCDataPoint])

    useEffect(() => {
        if (qtdDocenteSemTCCDataPoint !== null && qtdDocenteSemTCCDataPoint !== undefined) {

            if (qtdDocenteSemTCCDataPoint == 0) {
                setRelatorioFiltered(relatorioQtdDocenteSemTCCPPI);
            } else if (qtdDocenteSemTCCDataPoint == 1) {
                setRelatorioFiltered(relatorioQtdDocenteSemTCCPPP);
            } else if (qtdDocenteSemTCCDataPoint == 2) {
                setRelatorioFiltered(relatorioQtdDocenteSemTCCPPIAndPPP);
            }

            let getFiltroLocal = JSON.parse(context.getFiltroDashboard())
            getFiltroLocal.selected.grafico.cargaHorariaTotalEnsino = null;
            getFiltroLocal.selected.grafico.cargaHorariaTotal = null;
            getFiltroLocal.selected.grafico.dimensao = null;
            getFiltroLocal.selected.grafico.analise = null;
            getFiltroLocal.selected.grafico.analiseTCC = null;
            getFiltroLocal.selected.grafico.submissao = null;
            getFiltroLocal.selected.grafico.titulacao = null;
            getFiltroLocal.selected.grafico.titulacaoTcc = null;
            getFiltroLocal.selected.grafico.titulacaoRegime = null;
            getFiltroLocal.selected.grafico.tccRegime = null;
            getFiltroLocal.selected.grafico.qtdDocenteComTCC = null;
            getFiltroLocal.selected.grafico.qtdDocenteSemTCC = qtdDocenteSemTCCDataPoint;
            onOpen();
            context.changeFiltroDashboard(JSON.stringify(getFiltroLocal));
        }
    }, [qtdDocenteSemTCCDataPoint])

    useMemo(() =>
        setAnaliseChart({
            series: [analise?.acima, analise?.abaixo, analise?.normal],
            options: {
                labels: [`ACIMA`, `ABAIXO`, `NORMAL`],
                colors: ["#dc3546", '#fec107', '#27a844'],
                legend: {
                    position: 'bottom',
                },
                plotOptions: {
                    pie: {
                        donut: {
                            size: '45%',
                        }
                    }
                },
                noData: {
                    text: 'Carregando...'
                },
                chart: {
                    redrawOnParentResize: true,
                    events: {
                        dataPointSelection: function (event, chartContext, { dataPointIndex }) {
                            setCargaHorariaTotalEnsinoDataPoint(undefined);
                            setCargaHorariaTotalDataPoint(undefined);
                            setDimensaoDataPoint(undefined);
                            setSubmissaoDataPoint(undefined);
                            setAnaliseTCCDataPoint(undefined);
                            setTitulacaoDataPoint(undefined);
                            setTitulacaoRegimeDataPoint(undefined);
                            setTitulacaoTccDataPoint(undefined);
                            setTccRegimeDataPoint(undefined);
                            setQtdDocenteComTCCDataPoint(undefined);
                            setQtdDocenteSemTCCDataPoint(undefined);
                            setAnaliseDataPoint(dataPointIndex);
                        }
                    }
                },
                dataLabels: {
                    dropShadow: {
                        enabled: false
                    },
                    formatter: function (val) {
                        return val.toFixed(0) + "%"
                    },
                    style: {
                        colors: (["#ffffff", "#000000", "#ffffff"])
                    }
                }
            }
        })
        , [analise])

    useMemo(() =>
        setDimensaoChart({
            series: [dimensao?.ensino, dimensao?.pesquisa, dimensao?.extensao, dimensao?.gestao],
            options: {
                labels: [`ENSINO`, `PESQUISA`, `EXTENSÃO`, `GESTÃO`],
                colors: ['var(--chakra-colors-red-500)', 'var(--chakra-colors-orange-500)', 'var(--chakra-colors-green-500)', 'var(--chakra-colors-blue-500)'],
                legend: {
                    position: 'bottom',
                    overflow: 'hidden'
                },
                plotOptions: {
                    pie: {
                        donut: {
                            size: '45%',
                        }
                    }
                },
                noData: {
                    text: 'Carregando...'
                },
                chart: {
                    redrawOnParentResize: true,
                    events: {
                        dataPointSelection: function (event, chartContext, { dataPointIndex }) {
                            setCargaHorariaTotalDataPoint(undefined);
                            setCargaHorariaTotalEnsinoDataPoint(undefined);
                            setSubmissaoDataPoint(undefined);
                            setAnaliseDataPoint(undefined);
                            setTitulacaoDataPoint(undefined);
                            setTitulacaoRegimeDataPoint(undefined);
                            setTitulacaoTccDataPoint(undefined);
                            setTccRegimeDataPoint(undefined);
                            setQtdDocenteComTCCDataPoint(undefined);
                            setQtdDocenteSemTCCDataPoint(undefined);
                            setDimensaoDataPoint(dataPointIndex);
                        }
                    }
                },
                dataLabels: {
                    dropShadow: {
                        enabled: false
                    },
                    formatter: function (val) {
                        return val.toFixed(0) + "%"
                    },
                    style: {
                        colors: (["#ffffff"])
                    }
                }
            }
        })
        , [dimensao])

    useMemo(() => {
        setTotalHorasJornadasChart({
            series: [cargaHorariaTotal?.horasOcupadas, cargaHorariaTotal?.horasOciosas],
            options: {
                labels: ["OCUPADAS", "OCIOSAS"],
                colors: ["var(--chakra-colors-black-900)", "var(--chakra-colors-black-600)"],
                legend: {
                    position: 'bottom',
                },
                plotOptions: {
                    pie: {
                        donut: {
                            size: '45%',
                        }
                    }
                },
                noData: {
                    mtext: 'Carregando...'
                },
                chart: {
                    redrawOnParentResize: true,
                    events: {
                        dataPointSelection: function (event, chartContext, { dataPointIndex }) {
                            setDimensaoDataPoint(undefined);
                            setSubmissaoDataPoint(undefined);
                            setAnaliseDataPoint(undefined);
                            setTitulacaoDataPoint(undefined);
                            setTitulacaoRegimeDataPoint(undefined);
                            setTitulacaoTccDataPoint(undefined);
                            setTccRegimeDataPoint(undefined);
                            setQtdDocenteComTCCDataPoint(undefined);
                            setQtdDocenteSemTCCDataPoint(undefined);
                            setAnaliseTCCDataPoint(undefined);
                            setCargaHorariaTotalDataPoint(dataPointIndex);
                        }
                    }
                },
                tooltip: {
                    y: {
                        formatter: function (val, opts) {
                            return val + " HORAS"
                        }
                    }
                },
                dataLabels: {
                    formatter: function (val) {
                        return val.toFixed(0) + "%"
                    },
                    dropShadow: {
                        enabled: false
                    },
                    style: {
                        colors: (["#ffffff", "#000000"])
                    }
                }
            }
        })
    }, [cargaHorariaTotal])

    useMemo(() => {
        setTotalHorasEnsinoChart({
            series: [cargaHorariaTotalEnsino?.horasOcupadas, cargaHorariaTotalEnsino?.horasOciosas],
            options: {
                labels: ["OCUPADAS", "OCIOSAS"],
                colors: ["#ae2f30", "var(--chakra-colors-red-500)"],
                legend: {
                    position: 'bottom',
                },
                plotOptions: {
                    pie: {
                        donut: {
                            size: '45%',
                        }
                    }
                },
                noData: {
                    text: "Carregando..."
                },
                chart: {
                    redrawOnParentResize: true,
                    events: {
                        dataPointSelection: function (event, chartContext, { dataPointIndex }) {
                            setCargaHorariaTotalDataPoint(undefined);
                            setDimensaoDataPoint(undefined);
                            setSubmissaoDataPoint(undefined);
                            setAnaliseDataPoint(undefined);
                            setTitulacaoDataPoint(undefined);
                            setTitulacaoRegimeDataPoint(undefined);
                            setTitulacaoTccDataPoint(undefined);
                            setTccRegimeDataPoint(undefined);
                            setQtdDocenteComTCCDataPoint(undefined);
                            setQtdDocenteSemTCCDataPoint(undefined);
                            setAnaliseTCCDataPoint(undefined);
                            setCargaHorariaTotalEnsinoDataPoint(dataPointIndex);
                        }
                    }
                },
                tooltip: {
                    y: {
                        formatter: function (val, opts) {
                            return val + " HORAS"
                        }
                    }
                },
                dataLabels: {
                    formatter: function (val) {
                        return val.toFixed(0) + "%"
                    },
                    dropShadow: {
                        enabled: false
                    }
                }
            }
        })
    }, [cargaHorariaTotalEnsino])

    useMemo(() =>
        setAnaliseTCCChart({
            series: [analiseTCC?.acima, analiseTCC?.abaixo, analiseTCC?.normal],
            options: {
                labels: [`ACIMA`, `ABAIXO`, `NORMAL`],
                colors: [`var(--chakra-colors-farol-red-600)`, `var(--chakra-colors-farol-yellow-600)`, `var(--chakra-colors-farol-green-600)`],
                legend: {
                    position: 'bottom',
                },
                plotOptions: {
                    pie: {
                        donut: {
                            size: '45%',
                        }
                    }
                },
                noData: {
                    text: 'Carregando...'
                },
                chart: {
                    redrawOnParentResize: true,
                    events: {
                        dataPointSelection: function (event, chartContext, { dataPointIndex }) {
                            setCargaHorariaTotalEnsinoDataPoint(undefined);
                            setCargaHorariaTotalDataPoint(undefined);
                            setDimensaoDataPoint(undefined);
                            setSubmissaoDataPoint(undefined);
                            setAnaliseDataPoint(undefined);
                            setTitulacaoDataPoint(undefined);
                            setTitulacaoRegimeDataPoint(undefined);
                            setTitulacaoTccDataPoint(undefined);
                            setTccRegimeDataPoint(undefined);
                            setQtdDocenteComTCCDataPoint(undefined);
                            setQtdDocenteSemTCCDataPoint(undefined);
                            setAnaliseTCCDataPoint(dataPointIndex);
                        }
                    }
                },
                dataLabels: {
                    dropShadow: {
                        enabled: false
                    },
                    formatter: function (val) {
                        return val.toFixed(0) + "%"
                    },
                    style: {
                        colors: (["#ffffff", "#000000", "#ffffff"])
                    }
                }
            }
        })
        , [analiseTCC])

    useEffect(() => {
        if (context.getFiltroDashboard()) {
            let getFiltroLocal = JSON.parse(context.getFiltroDashboard());
            getFiltroLocal.currentTab = currentTab;
            getFiltroLocal.currentSubTab = currentSubTab;
            context.changeFiltroDashboard(JSON.stringify(getFiltroLocal));
        }
    }, [currentTab, currentSubTab])

    useMemo(() => {
        setSubmissaoChart({
            series: [submissao?.submetidos, submissao?.naoSubmetidos],
            options: {
                labels: [`SUBMETIDOS`, `NÃO SUBMETIDOS`],
                colors: ['var(--chakra-colors-black-900)', "var(--chakra-colors-black-600)"],
                legend: {
                    position: 'bottom',
                    overflow: 'hidden'
                },
                plotOptions: {
                    pie: {
                        donut: {
                            size: '45%',
                        }
                    }
                },
                noData: {
                    text: 'Carregando...'
                },
                chart: {
                    type: "pie",
                    redrawOnParentResize: true,
                    events: {
                        dataPointSelection: function (event, chartContext, { dataPointIndex }) {
                            setCargaHorariaTotalEnsinoDataPoint(undefined);
                            setCargaHorariaTotalDataPoint(undefined);
                            setDimensaoDataPoint(undefined);
                            setTitulacaoDataPoint(undefined);
                            setAnaliseTCCDataPoint(undefined);
                            setAnaliseDataPoint(undefined);
                            setTitulacaoRegimeDataPoint(undefined);
                            setTitulacaoTccDataPoint(undefined);
                            setTccRegimeDataPoint(undefined);
                            setQtdDocenteComTCCDataPoint(undefined);
                            setQtdDocenteSemTCCDataPoint(undefined);
                            setSubmissaoDataPoint(dataPointIndex);
                        }
                    }
                },
                dataLabels: {
                    dropShadow: {
                        enabled: false
                    },
                    formatter: function (val) {
                        return val.toFixed(0) + "%"
                    },
                    style: {
                        colors: (["#ffffff", "var(--chakra-colors-black-900)"])
                    }
                }
            }
        })
    }, [submissao])

    useMemo(() => {
        setTitulacaoChart({
            series: titulacao?.series,
            options: {
                labels: titulacao?.options.legends,
                colors: titulacao?.options.colors,
                legend: {
                    position: 'bottom',
                },
                plotOptions: {
                    pie: {
                        donut: {
                            size: '45%',
                        }
                    }
                },
                noData: {
                    text: 'Carregando...'
                },
                chart: {
                    redrawOnParentResize: true,
                    events: {
                        dataPointSelection: function (event, chartContext, { dataPointIndex }) {
                            setCargaHorariaTotalEnsinoDataPoint(undefined);
                            setCargaHorariaTotalDataPoint(undefined);
                            setDimensaoDataPoint(undefined);
                            setSubmissaoDataPoint(undefined);
                            setAnaliseDataPoint(undefined);
                            setAnaliseTCCDataPoint(undefined);
                            setTitulacaoRegimeDataPoint(undefined);
                            setTitulacaoTccDataPoint(undefined);
                            setTccRegimeDataPoint(undefined);
                            setQtdDocenteComTCCDataPoint(undefined);
                            setQtdDocenteSemTCCDataPoint(undefined);
                            setTitulacaoDataPoint(dataPointIndex);
                        }
                    }
                },
                dataLabels: {
                    dropShadow: {
                        enabled: false
                    },
                    formatter: function (val) {
                        return val.toFixed(0) + "%"
                    },
                    style: {
                        colors: (["#ffffff", "#000000", "#000000"])
                    }
                },
                tooltip: {
                    y: {
                        formatter: function (val, opts) {
                            return val + " DOCENTES"
                        }
                    }
                },
            }
        });
    }, [titulacao])

    useMemo(() => {
        setTitulacaoRegimeChart({
            series: titulacaoRegime?.series,
            options: {
                labels: titulacaoRegime?.options.legends,
                colors: titulacaoRegime?.options.colors,
                legend: {
                    position: 'bottom',
                },
                plotOptions: {
                    pie: {
                        donut: {
                            size: '45%',
                        }
                    }
                },
                noData: {
                    text: 'Carregando...'
                },
                chart: {
                    redrawOnParentResize: true,
                    events: {
                        dataPointSelection: function (event, chartContext, { dataPointIndex }) {
                            setCargaHorariaTotalEnsinoDataPoint(undefined);
                            setCargaHorariaTotalDataPoint(undefined);
                            setDimensaoDataPoint(undefined);
                            setSubmissaoDataPoint(undefined);
                            setAnaliseTCCDataPoint(undefined);
                            setAnaliseDataPoint(undefined);
                            setTitulacaoDataPoint(undefined);
                            setTitulacaoTccDataPoint(undefined);
                            setTccRegimeDataPoint(undefined);
                            setQtdDocenteComTCCDataPoint(undefined);
                            setQtdDocenteSemTCCDataPoint(undefined);
                            setTitulacaoRegimeDataPoint(dataPointIndex);
                        }
                    }
                },
                dataLabels: {
                    dropShadow: {
                        enabled: false
                    },
                    formatter: function (val) {
                        return val.toFixed(0) + "%"
                    },
                    style: {
                        colors: (["#ffffff", "#ffffff", "#ffffff", "#000000", "#000000"])
                    }
                },
                tooltip: {
                    y: {
                        formatter: function (val, opts) {
                            return val + " DOCENTES"
                        }
                    }
                },
            }
        })
    }, [titulacaoRegime])

    useMemo(() => {
        setTitulacaoTccChart({
            series: titulacaoTcc?.series,
            options: {
                labels: titulacaoTcc?.options.legends,
                colors: titulacaoTcc?.options.colors,
                legend: {
                    position: 'bottom',
                },
                plotOptions: {
                    pie: {
                        donut: {
                            size: '45%',
                        }
                    }
                },
                noData: {
                    text: 'Carregando...'
                },
                chart: {
                    redrawOnParentResize: true,
                    events: {
                        dataPointSelection: function (event, chartContext, { dataPointIndex }) {
                            setCargaHorariaTotalEnsinoDataPoint(undefined);
                            setCargaHorariaTotalDataPoint(undefined);
                            setDimensaoDataPoint(undefined);
                            setSubmissaoDataPoint(undefined);
                            setAnaliseDataPoint(undefined);
                            setAnaliseTCCDataPoint(undefined);
                            setTitulacaoRegimeDataPoint(undefined);
                            setTitulacaoDataPoint(undefined);
                            setTccRegimeDataPoint(undefined);
                            setQtdDocenteComTCCDataPoint(undefined);
                            setQtdDocenteSemTCCDataPoint(undefined);
                            setTitulacaoTccDataPoint(dataPointIndex);
                        }
                    }
                },
                dataLabels: {
                    style: {
                        textShadow: false
                    },
                    formatter: function (val) {
                        return val.toFixed(0) + "%"
                    },
                    background: {
                        enabled: true,
                        foreColor: 'white',
                        opacity: 0,
                    },
                    dropShadow: {
                        enabled: false
                    }
                },
                tooltip: {
                    y: {
                        formatter: function (val, opts) {
                            return val + "H DE ORIENTAÇÕES"
                        }
                    }
                },
            }
        });
    }, [titulacaoTcc])

    useMemo(() => {
        setTccRegimeChart({
            series: tccRegime?.series,
            options: {
                labels: tccRegime?.options.legends,
                colors: tccRegime?.options.colors,
                legend: {
                    position: 'bottom',
                },
                plotOptions: {
                    pie: {
                        donut: {
                            size: '45%',
                        }
                    }
                },
                noData: {
                    text: 'Carregando...'
                },
                chart: {
                    redrawOnParentResize: true,
                    events: {
                        dataPointSelection: function (event, chartContext, { dataPointIndex }) {
                            setCargaHorariaTotalEnsinoDataPoint(undefined);
                            setCargaHorariaTotalDataPoint(undefined);
                            setDimensaoDataPoint(undefined);
                            setSubmissaoDataPoint(undefined);
                            setAnaliseTCCDataPoint(undefined);
                            setAnaliseDataPoint(undefined);
                            setTitulacaoDataPoint(undefined);
                            setTitulacaoTccDataPoint(undefined);
                            setTitulacaoRegimeDataPoint(undefined);
                            setQtdDocenteComTCCDataPoint(undefined);
                            setQtdDocenteSemTCCDataPoint(undefined);
                            setTccRegimeDataPoint(dataPointIndex);
                        }
                    }
                },
                dataLabels: {
                    style: {
                        textShadow: false
                    },
                    formatter: function (val) {
                        return val.toFixed(0) + "%"
                    },
                    background: {
                        enabled: true,
                        foreColor: 'white',
                        opacity: 0,
                    },
                    dropShadow: {
                        enabled: false
                    }
                },
                tooltip: {
                    y: {
                        formatter: function (val, opts) {
                            return val + "H DE ORIENTAÇÕES"
                        }
                    }
                },
            }
        })
    }, [tccRegime])

    useMemo(() => {
        setQtdDocenteComTCCChart({
            series: [{
                name: "Média de orientações de TCC por orientador",
                data: [{
                    x: "PPI",
                    y: qtdDocenteComTCC?.totalOrientacoesPPI
                }, {
                    x: "PPP",
                    y: qtdDocenteComTCC?.totalOrientacoesPPP
                },
                {
                    x: "TOTAL",
                    y: qtdDocenteComTCC?.totalOrientacoesPPIAndPPP
                }]
            }],
            options: {
                colors: ['var(--chakra-colors-orange-500)', 'var(--chakra-colors-orange-800)', 'var(--chakra-colors-orange-600)'],
                dataLabels: {
                    dropShadow: {
                        enabled: false
                    }
                },
                chart: {
                    redrawOnParentResize: true,
                    toolbar: {
                        show: false,
                    },
                    type: "bar",
                    height: 380,
                    events: {
                        dataPointSelection: function (event, chartContext, { dataPointIndex }) {
                            setCargaHorariaTotalEnsinoDataPoint(undefined);
                            setCargaHorariaTotalDataPoint(undefined);
                            setDimensaoDataPoint(undefined);
                            setSubmissaoDataPoint(undefined);
                            setAnaliseDataPoint(undefined);
                            setAnaliseTCCDataPoint(undefined);
                            setTitulacaoRegimeDataPoint(undefined);
                            setTitulacaoTccDataPoint(undefined);
                            setTccRegimeDataPoint(undefined);
                            setTitulacaoDataPoint(undefined);
                            setQtdDocenteSemTCCDataPoint(undefined);
                            setQtdDocenteComTCCDataPoint(dataPointIndex);
                        }
                    }
                },
                xaxis: {
                    type: 'category',
                    labels: {
                        formatter: function (val) {
                            return val;
                        }
                    }
                },
                tooltip: {
                    x: {
                        formatter: function (val, opts) {
                            if (opts.dataPointIndex === 0) {
                                return val + ": " + qtdDocenteComTCC?.relatorioPPI.length + " docentes";
                            } else if (opts.dataPointIndex === 1) {
                                return val + ": " + qtdDocenteComTCC?.relatorioPPP.length + " docentes";
                            } else {
                                return val + ": " + qtdDocenteComTCC?.totalDocentesComTcc + " docentes";
                            }
                        }
                    },
                    y: {
                        formatter: function (val, opts) {
                            if (opts.dataPointIndex === 0) {
                                return qtdDocenteComTCC?.media.PPI + " orientações";
                            } else if (opts.dataPointIndex === 1) {
                                return qtdDocenteComTCC?.media.PPP + " orientações";
                            } else {
                                return qtdDocenteComTCC?.media.todos + " orientações";
                            }
                        }
                    }
                },
            },
        });
    }, [qtdDocenteComTCC])

    useMemo(() => {
        setQtdDocenteSemTCCChart({
            series: [{
                name: "Quantidade",
                data: [{
                    x: "PPI",
                    y: qtdDocenteSemTCC?.totalDocentesPPISemTcc
                }, {
                    x: "PPP",
                    y: qtdDocenteSemTCC?.totalDocentesPPPSemTcc
                }, {
                    x: "TOTAL",
                    y: qtdDocenteSemTCC?.totalDocentesSemTcc
                }]
            }],
            options: {
                colors: ['var(--chakra-colors-orange-500)', 'var(--chakra-colors-orange-800)'],
                dataLabels: {
                    dropShadow: {
                        enabled: false
                    }
                },
                chart: {
                    redrawOnParentResize: true,
                    toolbar: {
                        show: false,
                    },
                    type: "bar",
                    height: 380,
                    events: {
                        dataPointSelection: function (event, chartContext, { dataPointIndex }) {
                            setCargaHorariaTotalEnsinoDataPoint(undefined);
                            setCargaHorariaTotalDataPoint(undefined);
                            setDimensaoDataPoint(undefined);
                            setSubmissaoDataPoint(undefined);
                            setAnaliseDataPoint(undefined);
                            setAnaliseTCCDataPoint(undefined);
                            setTitulacaoRegimeDataPoint(undefined);
                            setTitulacaoTccDataPoint(undefined);
                            setTccRegimeDataPoint(undefined);
                            setTitulacaoDataPoint(undefined);
                            setQtdDocenteComTCCDataPoint(undefined);
                            setQtdDocenteSemTCCDataPoint(dataPointIndex);
                        }
                    }
                },
                xaxis: {
                    type: 'category',
                    labels: {
                        formatter: function (val) {
                            return val
                        }
                    }
                },
                tooltip: {
                    y: {
                        formatter: function (val, opts) {
                            return val + " docentes";
                        }
                    }
                },
            },
        });
    }, [qtdDocenteSemTCC])

    // Logs Gestores
    // useMemo(() => {
    //     setRevisaoChart({
    //         series: [relatorioGestoresAprovacoes.length, relatorioGestoresReprovacoes.length, relatorioGestoresRevisoes.length, relatorioGestoresNaoAvaliaram.length],
    //         options: {
    //             labels: ["APROVOU", "REPROVOU", "REVISOU", "NÃO AVALIOU"],
    //             colors: ['var(--chakra-colors-black-900)', "var(--chakra-colors-black-800)", "var(--chakra-colors-black-700)", "var(--chakra-colors-black-600)"],
    //             legend: {
    //                 position: 'bottom',
    //                 overflow: 'hidden'
    //             },
    //             plotOptions: {
    //                 pie: {
    //                     donut: {
    //                         size: '45%',
    //                     }
    //                 }
    //             },
    //             noData: {
    //                 text: 'Carregando...'
    //             },
    //             chart: {
    //                 redrawOnParentResize: true,
    //                 events: {
    //                     dataPointSelection: function (event, chartContext, { dataPointIndex }) {
    //                         setRevisaoDataPoint(dataPointIndex);
    //                     }
    //                 }
    //             },
    //             dataLabels: {
    //                 dropShadow: {
    //                     enabled: false
    //                 },
    //                 formatter: function (val) {
    //                     return val.toFixed(0) + "%"
    //                 },
    //                 style: {
    //                     colors: (["#ffffff", "#ffffff", "#000000", "#ffffff"])
    //                 }
    //             }
    //         }
    //     })
    // }, [relatorioGestoresAprovacoes.length, relatorioGestoresReprovacoes.length, relatorioGestoresRevisoes.length, relatorioGestoresNaoAvaliaram.length])

    // // Logs Gestores
    // useEffect(() => {
    //     if (revisaoDataPoint !== null && revisaoDataPoint !== undefined) {
    //         if (revisaoDataPoint == 0) {
    //             setRelatorioLogsGestoresFiltered(relatorioGestoresAprovacoes);
    //         } else if (revisaoDataPoint == 1) {
    //             setRelatorioLogsGestoresFiltered(relatorioGestoresReprovacoes);
    //         } else if (revisaoDataPoint == 2) {
    //             setRelatorioLogsGestoresFiltered(relatorioGestoresRevisoes);
    //         } else if (revisaoDataPoint == 3) {
    //             setRelatorioLogsGestoresFiltered(relatorioGestoresNaoAvaliaram);
    //         }
    //         disclosureLogsGestores.onOpen();
    //     }
    // }, [revisaoDataPoint])

    // useMemo(() =>
    //     {
    //         let monitoriaAprovacoes = 100;
    //         let monitoriaReprovacoes = 50;
    //         let monitoriaRevisoes = 123;
    //         let monitoriaNaoAvaliados = 131;

    //         let SupEstagioAprovacoes = 20;
    //         let SupEstagioReprovacoes = 342;
    //         let SupEstagioRevisoes = 59;
    //         let SupEstagioNaoAvaliados = 124;

    //         let NDEAprovacoes = 20;
    //         let NDEReprovacoes = 342;
    //         let NDERevisoes = 59;
    //         let NDENaoAvaliados = 124;

    //         setLogsGestoresEnsinoChart({
    //             series: [{
    //                 name: 'REGIANE MORENO',
    //                 data: [11, 5, 2]
    //               }, {
    //                 name: 'EURICO LUIZ PROSPERO RUIVO',
    //                 data: [1, 2, 5]
    //               }, {
    //                 name: 'FABIO APARECIDO GAMARRA LUBACHESKI',
    //                 data: [8, 1, 5]
    //               },{
    //                 name: 'FABIO SILVA LOPES',
    //                 data: [3, 0, 2]
    //               }],
    //               options: {
    //                 colors: ['var(--chakra-colors-red-900)','var(--chakra-colors-red-700)','var(--chakra-colors-red-500)','var(--chakra-colors-red-300)'],
    //                 chart: {
    //                   type: 'bar',
    //                   height: 350,
    //                   stacked: true,
    //                   events: {
    //                     dataPointSelection: function (event, chartContext, config) {
    //                         disclosureLogsGestores.onOpen();
    //                     }
    //                 },
    //                 },
    //                 plotOptions: {
    //                   bar: {
    //                     horizontal: true,
    //                     dataLabels: {
    //                       total: {
    //                         enabled: true,
    //                         offsetX: 0,
    //                         style: {
    //                           fontSize: '13px',
    //                           fontWeight: 900
    //                         }
    //                       }
    //                     }
    //                   },
    //                 },
    //                 stroke: {
    //                   width: 1,
    //                   colors: ['#fff']
    //                 },
    //                 xaxis: {
    //                   categories: ["NDE", "MONITORIA", "SUP. ESTÁGIO"],
    //                   labels: {
    //                     formatter: function (val) {
    //                       return val + ""
    //                     }
    //                   }
    //                 },
    //                 yaxis: {
    //                   title: {
    //                     text: undefined
    //                   },
    //                 },
    //                 tooltip: {
    //                   y: {
    //                     formatter: function (val) {
    //                         return val + " ações"
    //                     }
    //                   }
    //                 },
    //                 fill: {
    //                   opacity: 1
    //                 },
    //                 legend: {
    //                   position: 'top',
    //                   horizontalAlign: 'left',
    //                   offsetX: 40
    //                 }
    //               },
                
    //         })
    //     }, [])

        // useMemo(() =>
        // {
        //     let emissaoAprovacoes = 100;
        //     let emissaoReprovacoes = 342;
        //     let emissaoRevisoes = 59;
        //     let emissaoNaoAvaliados = 124;

        //     let OrientacaoPesquisaAprovacoes = 100;
        //     let OrientacaoPesquisaReprovacoes = 342;
        //     let OrientacaoPesquisaRevisoes = 59;
        //     let OrientacaoPesquisaNaoAvaliados = 124;

        //     let ParticipacaoBancaAprovacoes = 100;
        //     let ParticipacaoBancaReprovacoes = 342;
        //     let ParticipacaoBancaRevisoes = 59;
        //     let ParticipacaoBancaNaoAvaliados = 124;
        
        //     setLogsGestoresPesquisaChart({
        //         series: [
        //             {
        //             name: 'APROVAÇÕES',
        //             data: [emissaoAprovacoes, OrientacaoPesquisaAprovacoes, ParticipacaoBancaAprovacoes]
        //           },
        //           {
        //             name: 'REPROVAÇÕES',
        //             data: [emissaoReprovacoes, OrientacaoPesquisaReprovacoes, ParticipacaoBancaReprovacoes]
        //           },
        //           {
        //             name: 'REVISÕES',
        //             data: [emissaoRevisoes, OrientacaoPesquisaRevisoes, ParticipacaoBancaRevisoes]
        //           },
        //           {
        //             name: 'NÃO AVALIADOS',
        //             data: [emissaoNaoAvaliados, OrientacaoPesquisaNaoAvaliados, ParticipacaoBancaNaoAvaliados]
        //           },
        //         ],
        //         options: {
        //             colors: ['var(--chakra-colors-black-900)', "var(--chakra-colors-black-800)", "var(--chakra-colors-black-700)", "var(--chakra-colors-black-600)"],
        //             chart: {
        //                 type: 'bar',
        //                 redrawOnParentResize: true,
        //                 events: {
        //                     dataPointSelection: function (event, chartContext, config) {
        //                         let serieIndex = config.seriesIndex;
        //                         let dataPointIndex = config.dataPointIndex;
        //                         console.log([serieIndex, dataPointIndex])
        //                     }
        //                 },
        //                 height: 350,
        //                 stacked: true,
        //                 toolbar: {
        //                     show: true
        //                 },
        //               zoom: {
        //                 enabled: true
        //               }
        //             },
                  
        //             responsive: [{
        //               breakpoint: 480,
        //               options: {
        //                 legend: {
        //                   position: 'bottom',
        //                   offsetX: -10,
        //                   offsetY: 0
        //                 }
        //               }
        //             }],
        //             plotOptions: {
        //               bar: {
        //                 horizontal: false,
        //                 borderRadius: 10,
        //                 dataLabels: {
        //                   total: {
        //                     enabled: false,
        //                     style: {
        //                       fontSize: '13px',
        //                       fontWeight: 900
        //                     }
        //                   }
        //                 }
        //               },
        //             },
        //             xaxis: {
        //               type: 'text',
        //               categories: ["EMISSÃO DE PARECER","ORIENTAÇÃO","PARTICIPAÇÃO BANCA"],
        //             },
        //             legend: {
        //               position: 'right',
        //               offsetY: 40,
        //               show:false
        //             },
        //             fill: {
        //               opacity: 1
        //             }
        //           },
        //     })
        // }, [])

        // useMemo(() =>
        // {
        //     let cursoAprovacoes = 100;
        //     let cursoReprovacoes = 342;
        //     let cursoRevisoes = 59;
        //     let cursoNaoAvaliados = 124;

        //     let orientacaoAprovacoes = 100;
        //     let orientacaoReprovacoes = 342;
        //     let orientacaoRevisoes = 59;
        //     let orientacaoNaoAvaliados = 124;     
            
        //     let participacaoAprovacoes = 100;
        //     let participacaoReprovacoes = 342;
        //     let participacaoRevisoes = 59;
        //     let participacaoNaoAvaliados = 124;  
            
        //     let programaProjetoAprovacoes = 100;
        //     let programaProjetoReprovacoes = 342;
        //     let programaProjetoRevisoes = 59;
        //     let programaProjetoNaoAvaliados = 124;  

        //     setLogsGestoresExtensaoChart({
        //         series: [
        //             {
        //             name: 'APROVAÇÕES',
        //             data: [cursoAprovacoes, orientacaoAprovacoes, participacaoAprovacoes, programaProjetoAprovacoes]
        //           },
        //           {
        //             name: 'REPROVAÇÕES',
        //             data: [cursoReprovacoes, orientacaoReprovacoes, participacaoReprovacoes, programaProjetoReprovacoes]
        //           },
        //           {
        //             name: 'REVISÕES',
        //             data: [cursoRevisoes, orientacaoRevisoes, participacaoRevisoes, programaProjetoRevisoes]
        //           },
        //           {
        //             name: 'NÃO AVALIADOS',
        //             data: [cursoNaoAvaliados, orientacaoNaoAvaliados, participacaoNaoAvaliados, programaProjetoNaoAvaliados]
        //           },
        //         ],
        //         options: {
        //             colors: ['var(--chakra-colors-black-900)', "var(--chakra-colors-black-800)", "var(--chakra-colors-black-700)", "var(--chakra-colors-black-600)"],
        //             chart: {
        //                 type: 'bar',
        //                 redrawOnParentResize: true,
        //                 events: {
        //                     dataPointSelection: function (event, chartContext, config) {
        //                         let serieIndex = config.seriesIndex;
        //                         let dataPointIndex = config.dataPointIndex;
        //                         console.log([serieIndex, dataPointIndex])
        //                     }
        //                 },
        //                 height: 350,
        //                 stacked: true,
        //                 toolbar: {
        //                     show: true
        //                 },
        //               zoom: {
        //                 enabled: true
        //               }
        //             },
                  
        //             responsive: [{
        //               breakpoint: 480,
        //               options: {
        //                 legend: {
        //                   position: 'bottom',
        //                   offsetX: -10,
        //                   offsetY: 0
        //                 }
        //               }
        //             }],
        //             plotOptions: {
        //               bar: {
        //                 horizontal: false,
        //                 borderRadius: 10,
        //                 dataLabels: {
        //                   total: {
        //                     enabled: false,
        //                     style: {
        //                       fontSize: '13px',
        //                       fontWeight: 900
        //                     }
        //                   }
        //                 }
        //               },
        //             },
        //             xaxis: {
        //               type: 'text',
        //               categories: ["CURSO","ORIENTAÇÃO","PARTICIPAÇÃO","PROGRAMA/PROJETO"],
        //             },
        //             legend: {
        //               position: 'right',
        //               offsetY: 40,
        //               show:false
        //             },
        //             fill: {
        //               opacity: 1
        //             }
        //           },
        //     })
        // }, [])

    const rowsDefault = GetRows(relatorio, role);
    const rowsVinculo = GetRows(relatorioPPas, role);

    const rowsDocentesPendentes = rowsDefault.filter(item => item.estado == "SUBMETIDO");

    const colsDefault: GridColDef[] = GetColumns(role);
    const colsVinculo: GridColDef[] = GetColumnsVinculo(role);

    const rowsFiltered = GetRows(relatorioFiltered, role);

    const isWideVersion = useBreakpointValue({
        base: false,
        lg: true,
    })

    var rowsDefaultTest = [] as GridRowModel[];

    rowsDefaultTest.push({
        id: 7000503,
        nome: "CELSO MINORU HARA",
        aprovacoes: 1,
        reprovacoes: 2,
        revisoes: 3,
        naoavaliados: 0,
    })

    rowsDefaultTest.push({
        id: 1085926,
        nome: "JOSE MAURICIO PASSOS NEPOMUCENO",
        aprovacoes: 2,
        reprovacoes: 1,
        revisoes: 2,
        naoavaliados: 4,
    })

    return (
        <>
            {<MenuSelectSemestre />}
            <Box as="form" onSubmit={handleSubmit(handleFiltrar)} width={"100%"} display={isWideVersion ? "flex" : "flex"} flexDirection={isWideVersion ? "row" : "column"} alignItems="center" justifyContent={"center"} bg="white" borderRadius="lg" mb={3} px={2} >
                <Box><Text color="black" fontSize="xl" fontWeight="semibold">Filtros</Text></Box>
                <Flex flexDirection={isWideVersion ? "row" : "column"} justifyContent={hasFullPermissao ? "space-between" : "center"} width={"100%"} p="6px 0 6px 0">
                    <Flex flexDirection={isWideVersion ? "row" : "column"} alignItems={isWideVersion ? "center" : ""}>
                        <Box margin={"3px"}>
                            <Select variant="filled" size="md" name={"codigoCampus"} mr="3" minWidth={"114px"} maxWidth="200px" focusBorderColor="black" _active={{ bgColor: "gray.100" }} _focus={{ bgColor: "gray.100" }} color="black" _placeholder={{ color: "black" }} {...register('codigoCampus')} onChange={e => changeCampus(e.target.value ? Number(e.target.value) : null)}>
                                <option value="" selected>Campus</option>
                                {campus.map(function (item, key) {
                                    return <option key={key} value={item.value}>{item.name}</option>
                                })}
                            </Select>
                        </Box>

                        <Box margin={"3px"}>
                            <Select variant="filled" size="md" name={"codigoUnidade"} mr="3" minWidth={"100px"} maxWidth="200px" {...register('codigoUnidade')} focusBorderColor="black" _active={{ bgColor: "gray.100" }} _focus={{ bgColor: "gray.100" }} onChange={e => changeUnidade(e.target.value ? Number(e.target.value) : null)} color="black" _placeholder={{ color: "black" }}>
                                <option value="" selected>Unidade</option>
                                {unidades.map(function (item, key) {
                                    return <option key={key} value={item.value}>{item.sigla}</option>;
                                })}
                            </Select>
                        </Box>

                        <Box margin={"3px"}>
                            <Select variant="filled" size="md" name={"codigoCurso"} mr="3" minWidth={"200px"} focusBorderColor="black" color="black" maxWidth="400px" _placeholder={{ color: "black" }} _active={{ bgColor: "gray.100" }} _focus={{ bgColor: "gray.100" }} {...register('codigoCurso')} onChange={e => changeCurso(e.target.value ? Number(e.target.value) : null)}>
                                <option value="" selected>Curso</option>
                                {cursos.map(function (item, key) {
                                    return <option key={key} value={item.value}>{item.name}</option>;
                                })}
                            </Select>
                        </Box>
                        {/* <Box margin={"3px"}>
                            <Select variant="filled" size="md" name={"codigoModalidade"} mr="3" minWidth={"95px"} focusBorderColor="black" color="black" maxWidth="400px" _placeholder={{ color: "black" }} _active={{ bgColor: "gray.100" }} _focus={{ bgColor: "gray.100" }} {...register('codigoModalidade')} onChange={e => changeModalidade(e.target.value ? Number(e.target.value) : null)}>
                                <option value="" selected>Modalidade</option>
                                {modalidade.map(function (item, key) {
                                    return <option key={key} value={item.value}>{item.name}</option>;
                                })}
                            </Select>
                        </Box> */}
                        {hasFullPermissao && <Grid margin={"3px"}>
                            <Select
                                variant="filled"
                                size="md"
                                name={"codigoRegime"}
                                focusBorderColor="black"
                                color="black"
                                width={157}
                                _placeholder={{ color: "black" }}
                                _active={{ bgColor: "gray.100" }} _focus={{ bgColor: "gray.100" }}
                                {...register('codigoRegime')}
                                onChange={e => changeRegime(e.target.value ? Number(e.target.value) : null)} >
                                <option value="" selected>Regime</option>
                                <option value="">TODOS</option>
                                {regimeJson.map(function (item, key) {
                                    if (Number(item.value) != 7) {
                                        return <option key={key} value={item.value}>{item.sigla}</option>;
                                    }
                                })}
                            </Select>
                        </Grid>}
                        {hasFullPermissao && <Grid margin={"3px"}>
                            <Select
                                variant="filled"
                                size="md"
                                name={"codigoFuncao"}
                                focusBorderColor="black"
                                color="black"
                                maxWidth="450px"
                                _placeholder={{ color: "black" }}
                                _active={{ bgColor: "gray.100" }} _focus={{ bgColor: "gray.100" }}
                                {...register('codigoFuncao')}
                                onChange={e => changeFuncao(e.target.value ? Number(e.target.value) : null)} >
                                <option value="" selected>Função</option>
                                <option value="">TODOS</option>
                                {getAllFuncoes().sort(function (a, b) {
                                    return a.nome < b.nome ? -1 : a.nome > b.nome ? 1 : 0;
                                }).map(function (item, key) {
                                    return <option key={key} value={item.codigo}>{item.nome}</option>;
                                })}
                            </Select>
                        </Grid>}

                    </Flex>
                    <Flex align={"flex-end"} width={isWideVersion ? "" : "100%"} justifyContent={isWideVersion ? "" : "center"} p="1">
                        <Button aria-label="Pesquisar" size="md" background="blackAlpha.900" color="whiteAlpha.900" fontWeight="normal" isLoading={formState.isSubmitting} jus type="submit">Aplicar</Button>
                    </Flex>

                </Flex>

            </Box>

            {filtro && <Tabs mt={3} defaultIndex={currentTab} isLazy={true}>

                <ModalRelatorioFiltered currentTab={currentTab} role={role} rowsFiltered={rowsFiltered} colsFiltered={colsDefault} isOpen={isOpen} onClose={onClose}
                    cargaHorariaTotalEnsinoDataPoint={cargaHorariaTotalEnsinoDataPoint}
                    cargaHorariaTotalDataPoint={cargaHorariaTotalDataPoint}
                    submissaoDataPoint={submissaoDataPoint}
                    dimensaoDataPoint={dimensaoDataPoint}
                    analiseDataPoint={analiseDataPoint}
                    titulacaoDataPoint={titulacaoDataPoint}
                    titulacaoRegimeDataPoint={titulacaoRegimeDataPoint}
                    titulacaoTccDataPoint={titulacaoTccDataPoint}
                    tccRegimeDataPoint={tccRegimeDataPoint}
                    analiseTCCDataPoint={analiseTCCDataPoint}
                    qtdDocenteComTCCDataPoint={qtdDocenteComTCCDataPoint}
                    qtdDocenteSemTCCDataPoint={qtdDocenteSemTCCDataPoint}
                    resetDatapointSelected={resetDatapointSelected} />

                {/* <ModalLogsGestoresEixo rowsFiltered={rowsDefaultTest} isOpen={disclosureLogsGestores.isOpen} onClose={disclosureLogsGestores.onClose} /> */}
                {/* <ModalLogsGestoresFiltered rowsFiltered={relatorioLogsGestoresFiltered} isOpen={disclosureLogsGestores.isOpen} onClose={disclosureLogsGestores.onClose} resetDatapointSelected={resetDatapointSelected} revisaoDataPoint={revisaoDataPoint} /> */}

                <TabList border="0">
                    <Tab padding="7px 10px" onClick={() => setCurrentTab(TAB_GRID.GRAFICO)} fontSize={14} border="0" width="86px" background="white" _selected={{ bg: "#C8CCDD", borderBottom: "3px solid black" }}>Gráficos</Tab>
                    <Tab padding="7px 10px" onClick={() => setCurrentTab(TAB_GRID.LISTA_DOCENTES)} fontSize={14} border="0" background="white" _selected={{ bg: "#C8CCDD", borderBottom: "3px solid black" }}>Lista de docentes</Tab>
                    <Tab padding="7px 10px" onClick={() => setCurrentTab(TAB_GRID.VINCULO_DOCENTES)} fontSize={14} border="0" background="white" _selected={{ bg: "#C8CCDD", borderBottom: "3px solid black" }}>Vínculo de docentes</Tab>
                    {!isPRGA && <Tab padding="7px 10px" onClick={() => setCurrentTab(TAB_GRID.DOCENTES_PENDENTES)} fontSize={14} border="0" background="white" _selected={{ bg: "#C8CCDD", borderBottom: "3px solid black" }}>Pendentes</Tab>}
                </TabList>
                <TabPanels>
                    <TabPanel className="graficos" padding="5px 20px 20px 20px" bg="white">
                        <Tabs mt={3} defaultIndex={currentSubTab} isLazy={true}>
                            <TabList border="0">
                                <Tab padding="7px 10px" onClick={() => setCurrentSubTab(SUBTAB_GRID.DOCENTES)} fontSize={14} border="0" background="white" _selected={{ bg: "#C8CCDD", borderBottom: "3px solid black" }}>Docentes</Tab>
                                <Tab padding="7px 10px" onClick={() => setCurrentSubTab(SUBTAB_GRID.CARGAS)} fontSize={14} border="0" background="white" _selected={{ bg: "#C8CCDD", borderBottom: "3px solid black" }}>Cargas</Tab>
                                <Tab padding="7px 10px" onClick={() => setCurrentSubTab(SUBTAB_GRID.TCC)} fontSize={14} border="0" background="white" _selected={{ bg: "#C8CCDD", borderBottom: "3px solid black" }}>TCC</Tab>
                                <Tab display="none" padding="7px 10px" onClick={() => setCurrentSubTab(SUBTAB_GRID.LOGS_GESTORES)} fontSize={14} border="0" background="white" _selected={{ bg: "#C8CCDD", borderBottom: "3px solid black" }}>Logs de gestores</Tab>
                            </TabList>
                            <TabPanels>
                                <TabPanel p={0}>
                                    <Grid templateColumns="repeat(3, 1fr)" gap={4} mt={3.5}>
                                        {submissaoChart.options.chart.type == "pie" && <GridItem colSpan={[3, 3, 1]} borderRadius={8} bg="white" p="4" textAlign="center" boxShadow="2xl">
                                            <Text mb="3" fontWeight={500}>PDA SUBMETIDOS</Text>
                                            <Chart options={submissaoChart.options} series={submissaoChart.series} type="donut" height={350} />
                                        </GridItem>}
                                        {titulacaoChart.series && <GridItem colSpan={[3, 3, 1]} borderRadius={8} bg="white" p="4" textAlign="center" boxShadow="2xl">
                                            <Text mb="3" fontWeight={500}>DOCENTE POR REGIME</Text>
                                            <Chart options={titulacaoRegimeChart.options} series={titulacaoRegimeChart.series} type="donut" height={350} />
                                        </GridItem>}
                                        {titulacaoChart.series && <GridItem colSpan={[3, 3, 1]} borderRadius={8} bg="white" p="4" textAlign="center" boxShadow="2xl">
                                            <Text mb="3" fontWeight={500}>DOCENTE POR TITULAÇÃO</Text>
                                            <Chart options={titulacaoChart.options} series={titulacaoChart.series} type="donut" height={350} />
                                        </GridItem>}
                                    </Grid>
                                </TabPanel>
                                <TabPanel p={0}>
                                    <Grid templateColumns="repeat(3, 1fr)" gap={4} mt={3.5}>
                                        <GridItem colSpan={[3, 3, 1]} borderRadius={8} bg="white" p="4" textAlign="center" boxShadow="2xl">
                                            <Text mb="3" fontWeight={500}>CARGA HORÁRIA POR DIMENSÃO</Text>
                                            <Chart options={dimensaoChart.options} series={dimensaoChart.series} type="donut" height={350} />
                                        </GridItem>
                                        <GridItem colSpan={[3, 3, 1]} borderRadius={8} bg="white" p="4" textAlign="center" boxShadow="2xl">
                                            <Text mb="3" fontWeight={500}>CARGA HORÁRIA TOTAL ENSINO</Text>
                                            <Chart options={totalHorasEnsinoChart.options} series={totalHorasEnsinoChart.series} type="donut" height={350} />
                                        </GridItem>
                                        <GridItem colSpan={[3, 3, 1]} borderRadius={8} bg="white" p="4" textAlign="center" boxShadow="2xl">
                                            <Text mb="3" fontWeight={500}>CARGA HORÁRIA TOTAL</Text>
                                            <Chart options={totalHorasJornadasChart.options} series={totalHorasJornadasChart.series} type="donut" height={350} />
                                        </GridItem>
                                    </Grid>
                                    <Grid justifyContent="center" templateColumns="repeat(3, 3fr)" gap={4} mt={3.5}>
                                        <GridItem></GridItem>
                                        <GridItem colSpan={[3, 3, 1]} borderRadius={8} bg="white" p="4" textAlign="center" boxShadow="2xl">
                                            <Text mb="3" fontWeight={500}>ANÁLISE DO PDA</Text>
                                            <Chart options={analiseChart.options} series={analiseChart.series} type="donut" height={350} />
                                        </GridItem>
                                        <GridItem></GridItem>
                                    </Grid>
                                </TabPanel>
                                <TabPanel p={0}>
                                    <Grid templateColumns="repeat(3, 1fr)" gap={4} mt={3.5}>
                                        {tccRegimeChart.series && <GridItem colSpan={[3, 3, 1]} borderRadius={8} bg="white" p="4" textAlign="center" boxShadow="2xl">
                                            <Text mb="3" fontWeight={500}>ORIENTAÇÃO DE TCC POR REGIME</Text>
                                            <Chart options={tccRegimeChart.options} series={tccRegimeChart.series} type="donut" height={350} />
                                        </GridItem>}
                                        {titulacaoTccChart.series && <GridItem colSpan={[3, 3, 1]} borderRadius={8} bg="white" p="4" textAlign="center" boxShadow="2xl">
                                            <Text mb="3" fontWeight={500}>ORIENTAÇÃO DE TCC POR TITULAÇÃO</Text>
                                            <Chart options={titulacaoTccChart.options} series={titulacaoTccChart.series} type="donut" height={350} />
                                        </GridItem>}
                                        <GridItem colSpan={[3, 3, 1]} borderRadius={8} bg="white" p="4" textAlign="center" boxShadow="2xl">
                                            <Text mb="3" fontWeight={500}>ANÁLISE PPG - ORIENTAÇÃO DE TCC</Text>
                                            <Chart options={analiseTCCChart.options} series={analiseTCCChart.series} type="donut" height={350} />
                                        </GridItem>
                                    </Grid>
                                    <Grid templateColumns="repeat(2, 1fr)" gap={4} mt={3.5}>
                                        {qtdDocenteComTCCChart.series && <GridItem colSpan={[3, 3, 1]} borderRadius={8} bg="white" p="4" textAlign="center" boxShadow="2xl">
                                            <Text mb="3" fontWeight={500}>QUANTIDADE DE ORIENTAÇÕES - TCC POR REGIME</Text>
                                            <Chart options={qtdDocenteComTCCChart.options} series={qtdDocenteComTCCChart.series} type="bar" height={350} />
                                        </GridItem>}
                                        {qtdDocenteSemTCCChart.series && <GridItem colSpan={[3, 3, 1]} borderRadius={8} bg="white" p="4" textAlign="center" boxShadow="2xl">
                                            <Text mb="3" fontWeight={500}>QUANTIDADE DE DOCENTES SEM TCC</Text>
                                            <Chart options={qtdDocenteSemTCCChart.options} series={qtdDocenteSemTCCChart.series} type="bar" height={350} />
                                        </GridItem>}
                                    </Grid>
                                </TabPanel>
                                {!isPRGA && hasFullPermissao && <TabPanel p={0}>
                                    {/* <Grid templateColumns="repeat(1, 1fr)" gap={4} mt={3.5}>
                                        <Box bg="white" borderRadius="7px" w="100%" h="434px" boxShadow="2xl" mt={3.5} overflow={!isWideVersion && "auto"}>
                                            <Text mb="3" textAlign="center" pt="30px" fontWeight={500}>LOGS DE GESTORES</Text>
                                            {revisaoChart !== null && <Chart options={revisaoChart.options} series={revisaoChart.series} type="donut" height={350} />}
                                        </Box>
                                    </Grid> */}
                                    <Grid templateColumns="repeat(1, 1fr)" mt={3.5}>
                                        {/* {logsGestoresEnsinoChart.series && <GridItem colSpan={[3, 3, 1]} borderRadius={8} bg="white" p="4" textAlign="center" boxShadow="2xl">
                                            <Text mb="3" fontWeight={500}>ENSINO</Text>
                                            <Chart options={logsGestoresEnsinoChart.options} type="bar" height={350} series={logsGestoresEnsinoChart.series} />
                                        </GridItem>} */}
                                        {/* {logsGestoresPesquisaChart.series && <GridItem colSpan={[3, 3, 1]} borderRadius={8} bg="white" p="4" textAlign="center" boxShadow="2xl">
                                            <Text mb="3" fontWeight={500}>PESQUISA</Text>
                                            <Chart options={logsGestoresPesquisaChart.options} type="bar" height={350} series={logsGestoresPesquisaChart.series} />
                                        </GridItem>}
                                        {logsGestoresExtensaoChart.series && <GridItem colSpan={[3, 3, 1]} borderRadius={8} bg="white" p="4" textAlign="center" boxShadow="2xl">
                                            <Text mb="3" fontWeight={500}>EXTENSÃO</Text>
                                            <Chart options={logsGestoresExtensaoChart.options} type="bar" height={350} series={logsGestoresExtensaoChart.series} />
                                        </GridItem>} */}
                                    </Grid>
                                </TabPanel>}
                            </TabPanels>
                        </Tabs>
                    </TabPanel>
                    <TabPanel className="lista-de-docentes" p={0}>
                        <Box bg="white" borderRadius="7px" p="4" w="100%" h="600px" boxShadow="2xl" mt={3.5} overflow={!isWideVersion && "auto"}>
                            <DataGrid localeText={TranslatePtBR()} rows={rowsDefault} columns={colsDefault} disableColumnMenu components={{
                                Toolbar: () => CustomToolbar(rowsDefault)
                            }}
                            />
                        </Box>
                    </TabPanel>
                    <TabPanel className="vinculo-de-docentes" p={0}>
                        <Box bg="white" borderRadius="7px" p="4" w="100%" h="600px" boxShadow="2xl" mt={3.5} overflow={!isWideVersion && "auto"}>
                            <DataGrid localeText={TranslatePtBR()} rows={rowsVinculo} columns={colsVinculo} disableColumnMenu components={{
                                Toolbar: () => CustomToolbarVinculo(rowsVinculo)
                            }}
                            />
                        </Box>
                    </TabPanel>
                    {!isPRGA && <TabPanel className="pendentes" p={0}>
                        <Box bg="white" borderRadius="7px" p="4" w="100%" h="600px" boxShadow="2xl" mt={3.5} overflow={!isWideVersion && "auto"}>
                            <DataGrid localeText={TranslatePtBR()} rows={rowsDocentesPendentes} columns={colsDefault} disableColumnMenu components={{
                                Toolbar: () => CustomToolbar(rowsDocentesPendentes)
                            }}
                            />
                        </Box>
                    </TabPanel>}
                </TabPanels>
            </Tabs>}
        </>
    )
}