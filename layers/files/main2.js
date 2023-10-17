getProducers().then(checkLibertyBlock);

function checkLibertyBlock() {
    document.querySelector("input[value=libertyblock]").checked = true
    updateSelectedBPs();
}

function toggleKeyInput () {
    var checked = document.querySelector('input[name="signing-method"]:checked').value;
    var privateKeyInput =  document.getElementById("private-key");
    var keyAlert = document.getElementById("key-alert");
    if (checked == "key") {
        privateKeyInput.style.display = "block";
    }
    else {
        privateKeyInput.style.display = "none";
        if (typeof scatter === "undefined") {
            var alert = `<div class="alert alert-danger" role="alert">
                Scatter is not installed. Refresh page after installing.
            </div>`
            document.getElementById('alerts').innerHTML = alert;
            return false;
        }
        else {
            scatter.getIdentity().catch(err => {
                if (err.type == "locked") {
                    var alert = `<div class="alert alert-danger" role="alert">
                        Please refresh page after unlocking Scatter. 
                    </div>`
                    document.getElementById('alerts').innerHTML = alert;
                }
            });
        }
    }
}

function filterProds () {
    var search = document.getElementById('filter-prods').value;
    document.querySelectorAll('.prod-row').forEach(function (row) {
        if (search === "")
            row.style.display = "table-row";
        else if (row.childNodes[3].textContent.indexOf(search) > -1)
            row.style.display = "table-row";
        else
            row.style.display = "none";
    });
}

function getEos() {
    var method = document.querySelector('input[name="signing-method"]:checked').value;
    var network = document.getElementById('network').value;
    var ip = network.slice(network.lastIndexOf("/") + 1, network.lastIndexOf(":"));
    var port = network.slice(network.lastIndexOf(":") + 1);
    if (method == "scatter") {
        var scatterNetwork = {
            blockchain: 'eos',
            host: ip,
            port: port,
            chainId: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906"
        }
        var config = {
            broadcast: true,
            sign: true,
            chainId: "a628a5a6123d6ed60242560f23354c557f4a02826e223bb38aad79ddeb9afbca"
        }        
        return scatter.eos(scatterNetwork, Eos, config);
    }
    else {
        var privateKey = document.getElementById('private-key').value;
        var config = {
            keyProvider: [privateKey],
            httpEndpoint: network,
            broadcast: true,
            sign: true,
            chainId: "aca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906",
            expireInSeconds: 30
        }
        return Eos(config);
    }
}

function getProducers() {
    var eos = getEos();
    var params = {
        json: true,
        scope: "freecitygamx",
        code: "freecitygamx",
        table: "users", 
         lower_bound: waxwallet,
         upper_bound: waxwallet,
        limit: 500
    }
    var tbody = document.querySelector("#block-producers tbody");
    tbody.innerHTML = "";

    return eos.getTableRows(params).then(resp => {
        var sorted = resp.rows.sort((b,a) => Number(a.total_vote) > Number(b.affiliate_wallet) ? -1:1);
        sorted.map((prod, i) => `
        <tr class="prod-row">
            <td>${i+1}</td>
            
            <td><a href="https://wax.bloks.io/account/${prod.affiliate_wallet}" target="_blank">${prod.affiliate_wallet}</a></td>
            
            <td><a href="https://wax.bloks.io/account/${prod.wallet}" target="_blank">${prod.wallet}</a></td>
                      
        </tr>
        `)
        .forEach(row => tbody.innerHTML += row);

        document.getElementsByName('vote-prods').forEach(e => {
            e.onclick = updateSelectedBPs;
        });

    });

}

function getSelectedBPs () {
    var checked = []
    document.getElementsByName('vote-prods').forEach(function (prod) {
        if (prod.checked)
            checked.push(prod.value);
    });
    return checked;
}

function updateSelectedBPs() {
    var checked = getSelectedBPs();
    document.getElementById("selected-bps").innerHTML = checked.join(', ');
    document.getElementById("selected-count").innerHTML = checked.length;
}

function prettyNumber(num) {
    num = parseInt(parseInt(num) / 1e10 * 2.8);
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

function refreshKeys() {
    scatter.forgetIdentity()
        .then(scatter.getIdentity)
        .then(() => {
            var alert = `<div class="alert alert-info" role="alert">
                Keys refreshed.
            </div>`
            document.getElementById('alerts').innerHTML = alert;
        });
}

function vote () {
    var eos = getEos();

    var selectedBPs = getSelectedBPs();
    if (selectedBPs.length > 30) {
        var alert = `<div class="alert alert-danger" role="alert">
            Maximum 30 block producers can be selected
        </div>`
        document.getElementById('alerts').innerHTML = alert;
        return false;
    }

    document.getElementById('vote').disabled = true;

    var sortedBPs = selectedBPs.sort();
    var account = document.getElementById('eos-account').value;
    eos.transaction(tr => {
        tr.voteproducer(account, "", sortedBPs);
    }).then(tx => {
        var alert = `<div class="alert alert-success" role="alert">
            Your vote has been cast. Refresh page for new vote counts.<br>
            TxID: ${tx.transaction_id}
        </div>`
        document.getElementById('alerts').innerHTML = alert;
        document.getElementById('private-key').value = "";
        
        document.getElementById('vote').disabled = false;
    }).catch(err => {
        console.error(err);
        if (typeof err == "string") {
            err = JSON.parse(err);
            var message = `Error: ${err.error.details[0].message}`;
        }
        else if (err.type == "account_missing")
            var message = `Error: Key does not match account. Click here to use a <a href="#" onclick="refreshKeys()">different identity</a>`;
        else if (err.message)
            var message = `Error: Transaction failed. ${err.message}`;
        else 
            var message = `Error: Transaction failed. ${err.type}. Try refreshing page.`;
        var alert = `<div class="alert alert-danger" role="alert">
            ${message}
        </div>`;
        document.getElementById('alerts').innerHTML = alert;

        document.getElementById('vote').disabled = false;
    });
}

function sendAlert (message, type) {
    var alert = `<div class="alert alert-warning" role="alert"></div>`
}
