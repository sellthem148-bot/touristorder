// Los textos que solo escribe el servidor, en español (misma forma que fr.ts, la referencia):
// posicionamiento, mensajes de error, correos, mensajes de WhatsApp enviados al cliente, páginas legales.
// El sitio trata al cliente de «usted». Español neutro: España y Latinoamérica.
import type { DictionnaireServeur } from "./fr";

const es: DictionnaireServeur = {
  meta: {
    titre: "{site}: sus compras, entregadas en su alojamiento en Israel",
    description:
      "Alimentación, productos para bebés, higiene, cargadores y lo que olvidó traer de vacaciones: haga su pedido y se lo entregamos por la noche en su alojamiento o en su hotel, en Netanya y en las ciudades cercanas.",
  },

  erreurs: {
    champs: "Revise los campos en rojo.",
    refusee: "Pedido rechazado.",
    tropDeCommandes: "Demasiados pedidos en poco tiempo. Inténtelo de nuevo en unos minutos.",
    panierIllisible: "No se puede leer el carrito: vuelva a cargar la página.",
    ferme: "Los pedidos están cerrados por el momento. Inténtelo de nuevo un poco más tarde.",
    villeNonLivree: "Todavía no entregamos en esta ciudad.",
    jourIndisponible: "Este día ya no está disponible: elija otro.",
    creneauComplet: "Esta franja horaria acaba de completarse: elija otra.",
    creneauCompletChamp: "Esta franja horaria está completa: elija otra.",
    creneauIndisponible: "Esta franja horaria ya no está disponible: elija otra.",
    expressNonPropose: "La entrega exprés no está disponible en esta franja horaria.",
    expressChamp: "No hay entrega exprés en esta franja horaria.",
    paiementRequis: "Elija una forma de pago.",
    pourboirePerime: "Esta propina ya no está disponible: vuelva a cargar la página.",
    pourboireChamp: "Elija un importe de la lista.",
    panierPerime: "Algunos artículos de su carrito ya no están disponibles o han cambiado. Hemos actualizado su carrito: revíselo.",
    minimum: "El pedido mínimo para {ville} es de {prix} en artículos (sin contar los gastos).",

    nomRequis: "Su nombre es obligatorio.",
    telephoneRequis: "Su número de teléfono es obligatorio.",
    telephoneLong: "Número demasiado largo.",
    telephoneInvalide: "Número no válido.",
    telephoneIndicatif: "Número no válido: indíquelo con el prefijo internacional (p. ej., +34 612 34 56 78).",
    emailRequis: "Su correo electrónico es obligatorio.",
    emailInvalide: "Correo electrónico no válido.",
    emailLong: "Correo electrónico demasiado largo.",
    villeRequise: "Elija una ciudad.",
    adresseRequise: "Indique la calle y el número, o el nombre del hotel.",
    etageRequis: "Indique el piso (0 para la planta baja).",
    appartementRequis: "Indique el número de apartamento o de habitación.",
    jourRequis: "Elija un día.",
    creneauRequis: "Elija una franja horaria.",
    maxCaracteres: "{max} caracteres como máximo.",
    remplacementRequis: "Elija qué hacer si falta un artículo.",
    tropArticles: "Demasiados artículos diferentes.",
    panierVide: "Su carrito está vacío.",

    tropDeDemandes: "Demasiadas solicitudes. Inténtelo de nuevo en un momento.",
    emailNonConfigure: "El envío de correos electrónicos aún no está configurado en este sitio.",
  },

  courriel: {
    par: " por {mode}",
    merciCommande: "¡Gracias, {prenom}! Su pedido {numero} ha quedado registrado.",
    merciDemande: "¡Gracias, {prenom}! Su solicitud {numero} ha quedado registrada.",
    suiteCommande: "Se prepara en cuanto recibimos su pago y después se entrega en su alojamiento.",
    suiteDemande: "Buscamos el artículo y le confirmamos el precio por WhatsApp antes de cualquier pago.",
    paiementTitre: "Pago",
    reglement: "Pago al hacer el pedido: {montant}{par}. Le enviamos los datos de pago por WhatsApp y empezamos sus compras en cuanto lo recibimos.",
    recevoirCoordonnees: "Recibir los datos de pago",
    livraisonTitre: "Entrega",
    suivreCommande: "Seguir mi pedido",
    suivreDemande: "Seguir mi solicitud",
    votreCommande: "Su pedido",
    totalAPayer: "Total a pagar",
    demandeHorsCatalogue: "Su solicitud fuera de catálogo:",
    demandeAide: "Le confirmamos el precio por WhatsApp antes de añadirlo a su pedido.",
    votreNote: "Su nota:",
    siManque: "Si falta un artículo, le avisamos por WhatsApp y se lo reembolsamos.",
    espaceTitre: "Su área de cliente",
    espaceTexte: "Consulte sus pedidos, vuelva a pedir con un solo toque y guarde su dirección.",
    ouvrirEspace: "Abrir mi área de cliente",
    question: "¿Tiene alguna pregunta?",
    ecrivezNous: "Escríbanos por WhatsApp",
    raisonCommande: "Usted recibe este correo porque se hizo un pedido en {site} con esta dirección.",
    monEspace: "Mi área de cliente",
    sujetCommande: "Su pedido {numero} está registrado. Entrega: {jour}, {creneau}",
    sujetDemande: "Su solicitud {numero} está registrada. Entrega: {jour}, {creneau}",
    apercuCommande: "Entrega: {quand} · total {total}",
    apercuDemande: "Entrega: {quand}",
    titreCommande: "Pedido registrado",
    titreDemande: "Solicitud registrada",

    connexionSujet: "Su enlace de acceso a {site}",
    connexionTitre: "Su área de cliente",
    connexionCorps: "Este es su enlace para abrir su área de cliente. Es válido durante {minutes} minutos.",
    connexionIgnorer: "Si no ha solicitado nada, ignore este correo: nadie puede entrar sin este enlace.",
    connexionApercu: "Enlace válido durante {minutes} minutos",
    connexionRaison: "Usted recibe este correo porque se solicitó un acceso a {site} con esta dirección.",
    connexionTexte: "Su enlace para abrir su área de cliente (válido durante {minutes} minutos):",
    connexionTexteIgnorer: "Si no ha solicitado nada, ignore este correo.",
  },

  messages: {
    par: " por {mode}",
    debut: "¡Hola, {prenom}! Le escribe {site}.",
    montantARegler: "Importe a pagar: {montant}{par}.",
    recueAPayer: "Hemos recibido su pedido n.º {numero}.",
    desReception: "En cuanto recibamos su pago, empezaremos sus compras.",
    suivi: "Seguimiento: {lien}",
    recueSansPaiement: "Hemos recibido su pedido n.º {numero}. Ya nos ocupamos de él.",
    recuePayee: "Hemos recibido su pago del pedido n.º {numero}, gracias. Ya nos ocupamos de él.",
    preparation: "Su pedido n.º {numero} está en preparación. Le avisaremos en cuanto salgamos.",
    enRoute: "Su pedido n.º {numero} está en camino.",
    merci: "¡Gracias por su pedido n.º {numero}! No dude en escribirnos si necesita algo más durante su estancia.",
    annulee: "Su pedido n.º {numero} ha sido cancelado.",
    remboursement: "Le reembolsamos {montant}.",
    question: "Escríbanos si tiene cualquier pregunta.",
    jArrive: "Estoy en camino con su pedido n.º {numero} y llego en unos diez minutos.",
    resteARegler: "Importe pendiente de pago: {montant}{mode}.",
  },

  juridique: {
    misAJour: "Última actualización: {date}",
    traduction: "Esta traducción se ofrece para su comodidad; en caso de diferencia, prevalece la versión en francés.",

    conditions: {
      titre: "Condiciones generales de venta",
      metaDescription: "Pedido, precios, pago, entrega, artículo no disponible, cancelación: las condiciones de venta de {site}.",
      intro: "Las presentes condiciones se aplican a todo pedido realizado en {site}. Al confirmar un pedido, usted las acepta.",
      paiementsParDefaut: "los medios indicados en el momento del pedido",
      service: {
        titre: "1. El servicio",
        p1: "{vendeur} ofrece un servicio de compras y de entrega a domicilio: compramos por usted, en comercios locales, los artículos que pide y después se los entregamos en la dirección indicada (alojamiento, hotel, alquiler).",
      },
      commande: {
        titre: "2. El pedido",
        p1: "Usted elige sus artículos en el sitio y después indica sus datos de contacto, su dirección completa (calle, piso, número de apartamento o de habitación), su número de teléfono y la franja horaria de entrega deseada. Le enviamos un correo electrónico de confirmación con un enlace para seguir su pedido.",
        p2: "También puede solicitar un artículo que no esté en el catálogo. Lo buscamos y después le confirmamos el precio por WhatsApp: solo se añade a su pedido con su consentimiento.",
        p3: "Podemos rechazar o cancelar un pedido, en particular si un artículo no se encuentra, si la dirección está fuera de la zona de entrega o si la información está incompleta. En ese caso, se reembolsa cualquier importe ya pagado.",
      },
      prix: {
        titre: "3. Los precios",
        p1: "Los precios se indican en séqueles (₪). El importe de su pedido incluye el precio de los artículos, los gastos de servicio y los gastos de entrega. Estos gastos pueden variar según la ciudad, el día y la hora de entrega, o si elige la entrega exprés: siempre se muestran antes de confirmar el pedido. La propina es opcional.",
        p2: "El precio de un artículo puede cambiar de un día para otro; el precio aplicado es el que se muestra en el momento de su pedido.",
      },
      paiement: {
        titre: "4. El pago",
        p1: "El pago se realiza al hacer el pedido, antes de la preparación, con {paiements}. Le comunicamos los datos de pago por WhatsApp. Empezamos sus compras en cuanto recibimos su pago.",
        p2: "Mientras no se reciba el pago, el pedido no se prepara. Si el pago llega demasiado tarde para la franja horaria elegida, le proponemos otra franja o la cancelación del pedido.",
      },
      livraison: {
        titre: "5. La entrega",
        villes: "Entregamos en las siguientes ciudades: {villes}.",
        sansVilles: "Entregamos en las ciudades indicadas en el sitio.",
        horaires: "Las entregas se realizan por la noche ({amplitude}), en la franja horaria que usted ha elegido.",
        creneau: "La entrega se realiza en la franja horaria que usted ha elegido.",
        limite: "Un pedido realizado y pagado antes de las {heure} puede entregarse esa misma noche, según las franjas horarias que sigan disponibles.",
        p2: "Le rogamos que esté disponible por WhatsApp y presente en la dirección indicada durante la franja horaria. Si la entrega no es posible por causas atribuibles a usted (ausencia, dirección incorrecta, teléfono que no responde), se podrá cobrar una nueva entrega, y los productos frescos no podrán reembolsarse.",
        p3: "Los horarios son orientativos: un retraso debido al tráfico o a un comercio no da derecho a indemnización, pero le avisaremos.",
      },
      indisponible: {
        titre: "6. Artículo no disponible",
        p1: "Si un artículo falta en la tienda, seguimos la opción que usted eligió al hacer el pedido: ponernos en contacto con usted, sustituirlo por uno equivalente o quitarlo. Un artículo no entregado no se cobra; si ya se había pagado, se le reembolsa por el medio de pago utilizado.",
      },
      annulation: {
        titre: "7. Cancelación",
        p1: "Puede cancelar su pedido sin cargo mientras no hayamos empezado sus compras: escríbanos por WhatsApp. En ese caso, se le reembolsa el importe pagado. Una vez hechas las compras para usted, el pedido ya no puede cancelarse.",
        p2: "Los productos alimenticios, frescos o de higiene no admiten devolución ni cambio, salvo error por nuestra parte o producto dañado. Estas condiciones no le privan de ninguno de los derechos que la ley le reconoce.",
      },
      reclamations: {
        titre: "8. Reclamaciones",
        p1: "Revise su pedido en el momento de la entrega. Si un artículo falta, es incorrecto o está dañado, contáctenos en un plazo de 24 horas, si es posible con una foto: sustituimos el artículo o se lo reembolsamos.",
      },
      produits: {
        titre: "9. Productos",
        p1: "No somos el fabricante de los productos entregados. Las descripciones y las fotos son orientativas; el envase puede ser diferente. En los productos vendidos al peso, el peso entregado puede variar ligeramente. En caso de alergia o de dieta especial, revise siempre la etiqueta del producto.",
        p2: "El alcohol solo se vende a personas mayores de edad: se puede pedir un documento de identidad en el momento de la entrega.",
      },
      donnees: {
        titre: "10. Datos personales",
        p1: "La información que nos confía sirve para tramitar y entregar su pedido. Los detalles están en nuestra [política de privacidad](/confidentialite).",
      },
      droit: {
        titre: "11. Legislación aplicable y contacto",
        p1: "Las presentes condiciones se rigen por la legislación israelí. En caso de dificultad, contáctenos primero: siempre buscamos una solución amistosa.",
        p2: "Para cualquier pregunta: [página de contacto](/contact). La identidad del vendedor figura en el [aviso legal](/mentions-legales).",
      },
    },

    confidentialite: {
      titre: "Política de privacidad",
      metaDescription: "Qué información recoge {site}, por qué, durante cuánto tiempo y cómo solicitar su modificación o eliminación.",
      intro: "{responsable} respeta su privacidad. Esta página explica qué información recogemos cuando usted utiliza {site}, qué hacemos con ella y cómo solicitar su modificación o eliminación.",
      recueil: {
        titre: "La información que recogemos",
        points: [
          "**Para un pedido**: su nombre, su número de teléfono (WhatsApp), su correo electrónico, su dirección de entrega (calle u hotel, piso, número de apartamento o de habitación, código de entrada), el contenido del pedido y sus posibles notas.",
          "**Para el pago**: la forma de pago elegida y la fecha del pago. En este sitio no recogemos números de tarjeta ni credenciales bancarias.",
          "**Para su área de cliente**: su correo electrónico, sus datos de contacto guardados, el idioma elegido y el historial de sus pedidos.",
          "**Datos técnicos**: la dirección IP, utilizada brevemente para proteger el sitio contra los abusos.",
        ],
      },
      usage: {
        titre: "Qué hacemos con ella",
        points: [
          "Preparar, entregar y seguir su pedido.",
          "Ponernos en contacto con usted acerca del pedido, por WhatsApp, por teléfono o por correo electrónico.",
          "Llevar nuestra contabilidad y cumplir nuestras obligaciones legales.",
          "Permitirle encontrar sus pedidos y volver a pedir más rápido.",
        ],
        p1: "No vendemos su información ni la utilizamos para publicidad personalizada.",
      },
      partage: {
        titre: "Con quién se comparte",
        p1: "Únicamente con los proveedores técnicos necesarios para el servicio: el alojamiento web del sitio y de su base de datos, el envío de los correos electrónicos de confirmación y los servicios de mensajería que utilizamos para escribirle y para recibir el aviso de un nuevo pedido. Estos proveedores pueden estar situados fuera de Israel y de la Unión Europea. Los comercios donde compramos sus artículos no reciben sus datos de contacto.",
      },
      cookies: {
        titre: "Cookies y almacenamiento en su navegador",
        p1: "El sitio no utiliza cookies publicitarias ni herramientas de seguimiento. Solo utiliza lo necesario para su funcionamiento: una cookie de inicio de sesión si abre su área de cliente, una cookie que recuerda el idioma elegido y el almacenamiento de su navegador para guardar su carrito y los enlaces de seguimiento de sus pedidos.",
      },
      duree: {
        titre: "Durante cuánto tiempo",
        p1: "Los pedidos se conservan durante el tiempo que exigen nuestras obligaciones contables y legales. Su área de cliente existe mientras usted lo desee: puede eliminarla en cualquier momento desde [su área de cliente](/compte).",
      },
      droits: {
        titre: "Sus derechos",
        p1: "Puede solicitar consultar, corregir o eliminar la información que le concierne. Sus datos de contacto se modifican directamente en su área de cliente; para cualquier otra solicitud, [contáctenos](/contact). Respondemos lo antes posible.",
        p1AvecEmail: "Puede solicitar consultar, corregir o eliminar la información que le concierne. Sus datos de contacto se modifican directamente en su área de cliente; para cualquier otra solicitud, [contáctenos](/contact) ([{email}](mailto:{email})). Respondemos lo antes posible.",
      },
      securite: {
        titre: "Seguridad",
        p1: "Las comunicaciones con el sitio están cifradas. El acceso a su área de cliente se hace mediante un enlace personal enviado a su correo electrónico, sin contraseña que recordar. El acceso a los pedidos está reservado al gerente.",
      },
    },

    mentions: {
      titre: "Aviso legal",
      metaDescription: "Titular, contacto y alojamiento web del sitio {site}.",
      editeur: "Titular del sitio",
      site: "Sitio",
      exploitant: "Operador",
      numero: "Número de empresa",
      adresse: "Dirección",
      email: "Correo electrónico",
      contact: "Contacto",
      pageContact: "Página de contacto",
      hebergement: {
        titre: "Alojamiento web",
        p1: "El sitio está alojado por Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, Estados Unidos (vercel.com). Los datos se guardan en una base de datos gestionada por Supabase.",
      },
      propriete: {
        titre: "Propiedad intelectual",
        p1: "El sitio, su logotipo y sus textos pertenecen a su titular. Las marcas y los nombres de productos citados pertenecen a sus respectivos propietarios: se mencionan únicamente para designar los artículos que compramos por usted.",
      },
      renvoi: {
        titre: "Condiciones y datos personales",
        p1: "Consulte las [condiciones generales de venta](/conditions) y la [política de privacidad](/confidentialite).",
      },
    },

    credits: {
      titre: "Créditos de las fotos",
      metaDescription: "Los autores y las licencias de las fotos ilustrativas utilizadas en {site}.",
      intro: "Algunas fotos de productos frescos son fotos ilustrativas, con licencia libre, procedentes de Wikimedia Commons. Muestran el producto, no necesariamente la variedad ni el envase que se entregan. Gracias a sus autores.",
      auteurs: "Autores y licencias",
      photoOrigine: "foto original",
      modifications: {
        titre: "Modificaciones",
        p1: "Las fotos se han recortado y comprimido. Las publicadas con una licencia «compartir igual» (CC BY-SA) siguen disponibles, en su versión recortada, con la misma licencia.",
      },
    },
  },
};

export default es;
